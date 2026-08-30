import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import {
  notifyCustomerOrderConfirmation,
  notifyNewSinpeOrder,
  notifyOrderPaid,
} from "./orderNotifier";
import type { EmailMessage, EmailSendResult, EmailService } from "@/lib/email/types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * These tests exercise the notifier's contract WITHOUT a database or Resend:
 *   - idempotency (the claim ledger) survives duplicate calls
 *   - guards skip the wrong method / unpaid orders
 *   - a provider failure is recorded, never thrown, and can be retried
 *
 * The fake admin client reimplements the two RPCs in memory with the exact
 * semantics of the SQL in 20260829000100_order_notifications.sql: claim flips
 * pending/failed → sending and returns the row id, otherwise returns null.
 */

type LedgerRow = { id: string; status: string; attempts: number };

interface OrderRow {
  id: string;
  order_number: number;
  created_at: string;
  payment_provider: string | null;
  payment_status: string;
  order_status: string;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  total: number;
  customer_name: string;
  customer_email: string | null;
  customer_phone: string;
  shipping_province: string;
  shipping_canton: string;
  shipping_district: string;
  shipping_address: string;
  shipping_reference: string | null;
  order_items: Array<{
    product_name: string;
    brand_name: string;
    product_type: "full_size" | "decant";
    size_ml: number;
    sku: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }>;
}

function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    order_number: 1024,
    created_at: "2026-08-29T15:00:00.000Z",
    payment_provider: "manual_sinpe",
    payment_status: "pending",
    order_status: "pending",
    subtotal: 40_000,
    shipping_cost: 5_000,
    discount: 0,
    total: 45_000,
    customer_name: "John Doe",
    customer_email: "john@example.com",
    customer_phone: "8888-8888",
    shipping_province: "San José",
    shipping_canton: "San José",
    shipping_district: "Carmen",
    shipping_address: "100m norte de la iglesia",
    shipping_reference: null,
    order_items: [
      {
        product_name: "Aventus",
        brand_name: "Creed",
        product_type: "decant",
        size_ml: 10,
        sku: "CR-AVE-10",
        quantity: 2,
        unit_price: 20_000,
        line_total: 40_000,
      },
    ],
    ...overrides,
  };
}

/** Fake admin client: in-memory ledger + a single order row. */
function makeAdmin(order: OrderRow | null) {
  const ledger = new Map<string, LedgerRow>();
  let idSeq = 0;

  const rpc = vi.fn(async (fn: string, args: any) => {
    if (fn === "claim_order_notification") {
      const key = `${args.p_order_id}:${args.p_type}`;
      let row = ledger.get(key);
      if (!row) {
        row = { id: `row-${++idSeq}`, status: "pending", attempts: 0 };
        ledger.set(key, row);
      }
      if (row.status === "pending" || row.status === "failed") {
        row.status = "sending";
        row.attempts += 1;
        return { data: row.id, error: null };
      }
      return { data: null, error: null }; // sent or in-flight
    }
    if (fn === "finalize_order_notification") {
      for (const row of ledger.values()) {
        if (row.id === args.p_id) row.status = args.p_status;
      }
      return { data: null, error: null };
    }
    return { data: null, error: null };
  });

  const from = vi.fn(() => ({
    select: () => ({
      eq: () => ({
        maybeSingle: async () => ({ data: order, error: null }),
      }),
    }),
  }));

  const client = { rpc, from } as unknown as SupabaseClient<Database>;
  return { client, ledger, rpc };
}

/** Fake email service: records every send; optionally fails N times first. */
function makeEmail(failTimes = 0): EmailService & { sent: EmailMessage[] } {
  const sent: EmailMessage[] = [];
  let fails = failTimes;
  return {
    sent,
    async send(message: EmailMessage): Promise<EmailSendResult> {
      if (fails > 0) {
        fails -= 1;
        return { ok: false, error: "resend down" };
      }
      sent.push(message);
      return { ok: true, id: `msg-${sent.length}` };
    },
  };
}

beforeEach(() => {
  vi.restoreAllMocks();
  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
  vi.spyOn(console, "warn").mockImplementation(() => {});
  // The customer email builds a token-authed order link.
  process.env.ORDER_TOKEN_SECRET = "test-secret-test-secret-test-secret";
});

describe("notifyNewSinpeOrder", () => {
  // Test 1
  it("sends a pending email for a SINPE order", async () => {
    const admin = makeAdmin(makeOrder());
    const email = makeEmail();

    const res = await notifyNewSinpeOrder("o1", {
      admin: admin.client,
      emailService: email,
      to: "owner@krov.cr",
    });

    expect(res.status).toBe("sent");
    expect(email.sent).toHaveLength(1);
    expect(email.sent[0].to).toBe("owner@krov.cr");
    expect(email.sent[0].subject).toContain("Pago pendiente");
    expect(email.sent[0].subject).toContain("KR-1024");
  });

  // Test 2 (creation path for a card order stays silent)
  it("skips a card order without sending", async () => {
    const admin = makeAdmin(makeOrder({ payment_provider: "onvo" }));
    const email = makeEmail();

    const res = await notifyNewSinpeOrder("o1", {
      admin: admin.client,
      emailService: email,
    });

    expect(res.status).toBe("skipped");
    expect(email.sent).toHaveLength(0);
  });

  // Test 6 / Test 8 — editing/refreshing never sends a second pending email
  it("is idempotent across repeated calls", async () => {
    const order = makeOrder();
    const admin = makeAdmin(order);
    const email = makeEmail();
    const deps = { admin: admin.client, emailService: email, to: "o@k.cr" };

    const first = await notifyNewSinpeOrder("o1", deps);
    const second = await notifyNewSinpeOrder("o1", deps);

    expect(first.status).toBe("sent");
    expect(second.status).toBe("skipped");
    expect(email.sent).toHaveLength(1);
  });
});

describe("notifyOrderPaid", () => {
  // Test 3 — Onvo confirms card payment → one paid email
  it("sends a paid email for a confirmed card order", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "onvo", payment_status: "paid" })
    );
    const email = makeEmail();

    const res = await notifyOrderPaid("o1", {
      admin: admin.client,
      emailService: email,
      to: "o@k.cr",
    });

    expect(res.status).toBe("sent");
    expect(email.sent).toHaveLength(1);
    // Card confirmation doubles as the new-order alert.
    expect(email.sent[0].subject).toContain("Nuevo pedido");
    expect(email.sent[0].subject).toContain("Pago confirmado");
  });

  // Test 4 / Test 8 — duplicate webhook delivery → exactly one email
  it("is idempotent across duplicate webhook deliveries", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "onvo", payment_status: "paid" })
    );
    const email = makeEmail();
    const deps = { admin: admin.client, emailService: email, to: "o@k.cr" };

    await notifyOrderPaid("o1", deps);
    const second = await notifyOrderPaid("o1", deps);

    expect(second.status).toBe("skipped");
    expect(email.sent).toHaveLength(1);
  });

  // Test 5 — SINPE pending → paid → one confirmation email (different subject)
  it("sends a SINPE confirmation with the confirmation subject", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "manual_sinpe", payment_status: "paid" })
    );
    const email = makeEmail();

    await notifyOrderPaid("o1", {
      admin: admin.client,
      emailService: email,
      to: "o@k.cr",
    });

    expect(email.sent[0].subject).toContain("Pago confirmado");
    expect(email.sent[0].subject).not.toContain("Nuevo pedido");
  });

  it("skips when the order is not actually paid", async () => {
    const admin = makeAdmin(makeOrder({ payment_status: "pending" }));
    const email = makeEmail();

    const res = await notifyOrderPaid("o1", {
      admin: admin.client,
      emailService: email,
      to: "o@k.cr",
    });

    expect(res.status).toBe("skipped");
    expect(email.sent).toHaveLength(0);
  });
});

describe("notifyCustomerOrderConfirmation", () => {
  it("sends a 'Confirmed / Paid' email to the customer for a card order", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "onvo", payment_status: "paid" })
    );
    const email = makeEmail();

    const res = await notifyCustomerOrderConfirmation("o1", {
      admin: admin.client,
      emailService: email,
    });

    expect(res.status).toBe("sent");
    expect(email.sent).toHaveLength(1);
    const msg = email.sent[0];
    expect(msg.to).toBe("john@example.com");
    expect(msg.from).toContain("ventas@krovperfumeriacr.com");
    expect(msg.subject).toBe("Confirmación de pedido #KR-1024 - Krov Perfumería");
    expect(msg.html).toContain("Confirmado / Pagado");
    expect(msg.html).toContain("Total pagado");
  });

  it("sends a 'Pending Payment Verification' email for a SINPE order", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "manual_sinpe", payment_status: "pending" })
    );
    const email = makeEmail();

    await notifyCustomerOrderConfirmation("o1", {
      admin: admin.client,
      emailService: email,
    });

    const msg = email.sent[0];
    expect(msg.html).toContain("Pago pendiente de verificación");
    expect(msg.html).toContain("Total por pagar");
    expect(msg.text).toContain("SINPE Móvil");
  });

  it("skips when the order has no customer email", async () => {
    const admin = makeAdmin(makeOrder({ customer_email: null }));
    const email = makeEmail();

    const res = await notifyCustomerOrderConfirmation("o1", {
      admin: admin.client,
      emailService: email,
    });

    expect(res.status).toBe("skipped");
    expect(email.sent).toHaveLength(0);
  });

  it("is idempotent — one confirmation per order", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "onvo", payment_status: "paid" })
    );
    const email = makeEmail();
    const deps = { admin: admin.client, emailService: email };

    await notifyCustomerOrderConfirmation("o1", deps);
    const second = await notifyCustomerOrderConfirmation("o1", deps);

    expect(second.status).toBe("skipped");
    expect(email.sent).toHaveLength(1);
  });
});

describe("failure handling", () => {
  // Test 7 — Resend fails: recorded, not thrown, and retryable afterwards
  it("records a failure without throwing and allows a later retry", async () => {
    const admin = makeAdmin(
      makeOrder({ payment_provider: "onvo", payment_status: "paid" })
    );
    const email = makeEmail(1); // first send fails, second succeeds
    const deps = { admin: admin.client, emailService: email, to: "o@k.cr" };

    const first = await notifyOrderPaid("o1", deps);
    expect(first.status).toBe("failed");
    expect(email.sent).toHaveLength(0);

    // A 'failed' ledger row is re-claimable, so a retry actually re-sends.
    const retry = await notifyOrderPaid("o1", deps);
    expect(retry.status).toBe("sent");
    expect(email.sent).toHaveLength(1);
  });

  it("marks the notification failed when the order vanished", async () => {
    const admin = makeAdmin(null);
    const email = makeEmail();

    const res = await notifyOrderPaid("o1", {
      admin: admin.client,
      emailService: email,
      to: "o@k.cr",
    });

    expect(res.status).toBe("failed");
    expect(email.sent).toHaveLength(0);
  });
});
