import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeSupabaseMock } from "@/test/helpers/supabaseMock";

const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { reviewWholesaleApplicationAction } from "./actions";

const UID = "11111111-1111-4111-8111-111111111111";

describe("reviewWholesaleApplicationAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("approves by calling review_wholesale_application with the right args", async () => {
    const mock = makeSupabaseMock({
      rpc: () => ({
        data: { user_id: UID, application_status: "approved", previous_status: "pending" },
        error: null,
      }),
    });
    createClientMock.mockReturnValue(mock.client);

    const res = await reviewWholesaleApplicationAction(UID, "approved");

    expect(res.ok).toBe(true);
    expect(res.message).toMatch(/aprobada/i);
    expect(mock.captured.rpc?.name).toBe("review_wholesale_application");
    expect(mock.captured.rpc?.args).toMatchObject({
      p_user_id: UID,
      p_decision: "approved",
    });
  });

  it("rejects by passing p_decision = 'rejected'", async () => {
    const mock = makeSupabaseMock({
      rpc: () => ({
        data: { user_id: UID, application_status: "rejected", previous_status: "pending" },
        error: null,
      }),
    });
    createClientMock.mockReturnValue(mock.client);

    const res = await reviewWholesaleApplicationAction(UID, "rejected");

    expect(res.ok).toBe(true);
    expect(mock.captured.rpc?.args).toMatchObject({ p_decision: "rejected" });
  });

  it("refuses an invalid user id without hitting the RPC", async () => {
    const mock = makeSupabaseMock({});
    createClientMock.mockReturnValue(mock.client);

    const res = await reviewWholesaleApplicationAction("not-a-uuid", "approved");

    expect(res.ok).toBe(false);
    expect(mock.client.rpc).not.toHaveBeenCalled();
  });

  it("maps an insufficient-privilege RPC error to a friendly message", async () => {
    const mock = makeSupabaseMock({
      rpc: () => ({
        data: null,
        error: { message: "Insufficient privilege: admin role required." },
      }),
    });
    createClientMock.mockReturnValue(mock.client);

    const res = await reviewWholesaleApplicationAction(UID, "approved");

    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/permiso/i);
  });

  it("explains when the RPC is missing (migration not applied)", async () => {
    const mock = makeSupabaseMock({
      rpc: () => ({
        data: null,
        error: {
          message:
            'function public.review_wholesale_application(uuid, text) does not exist',
        },
      }),
    });
    createClientMock.mockReturnValue(mock.client);

    const res = await reviewWholesaleApplicationAction(UID, "approved");

    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/migración|migracion/i);
  });
});
