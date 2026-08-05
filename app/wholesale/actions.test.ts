import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeSupabaseMock, type SupabaseMockConfig } from "@/test/helpers/supabaseMock";

// createClient + revalidatePath are hoisted mocks so the action resolves against
// our fake client instead of a real request/database.
const { createClientMock } = vi.hoisted(() => ({ createClientMock: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: createClientMock }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { applyForWholesaleAction } from "./actions";

const validInput = {
  company_name: "Perfumería Aurora",
  tax_id: "3-101-123456",
  business_activity: "Venta al detalle de perfumería",
  website: "",
};

function setup(config: SupabaseMockConfig) {
  const mock = makeSupabaseMock(config);
  createClientMock.mockReturnValue(mock.client);
  return mock;
}

describe("applyForWholesaleAction", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a pending wholesale_profiles row for a standard customer", async () => {
    const mock = setup({
      user: { id: "u1" },
      profileRole: "customer",
      existingApplication: null,
    });

    const res = await applyForWholesaleAction(validInput);

    expect(res.ok).toBe(true);
    expect(mock.captured.insert?.table).toBe("wholesale_profiles");
    expect(mock.captured.insert?.row).toMatchObject({
      user_id: "u1",
      company_name: "Perfumería Aurora",
      tax_id: "3-101-123456",
      application_status: "pending",
    });
  });

  it("normalizes an empty website to null", async () => {
    const mock = setup({ user: { id: "u1" }, profileRole: "customer" });
    await applyForWholesaleAction(validInput);
    expect(mock.captured.insert?.row.website).toBeNull();
  });

  it("rejects a guest (not signed in)", async () => {
    setup({ user: null });
    const res = await applyForWholesaleAction(validInput);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/iniciar sesión/i);
  });

  it("blocks an account that is already wholesale", async () => {
    setup({ user: { id: "u1" }, profileRole: "wholesale" });
    const res = await applyForWholesaleAction(validInput);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/mayorista/i);
  });

  it("blocks admin accounts", async () => {
    setup({ user: { id: "u1" }, profileRole: "admin" });
    const res = await applyForWholesaleAction(validInput);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/administrador/i);
  });

  it("blocks a duplicate pending application", async () => {
    setup({
      user: { id: "u1" },
      profileRole: "customer",
      existingApplication: { application_status: "pending" },
    });
    const res = await applyForWholesaleAction(validInput);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/pendiente/i);
  });

  it("allows re-applying after a rejection (updates status back to pending)", async () => {
    const mock = setup({
      user: { id: "u1" },
      profileRole: "customer",
      existingApplication: { application_status: "rejected" },
    });

    const res = await applyForWholesaleAction(validInput);

    expect(res.ok).toBe(true);
    expect(mock.captured.update?.table).toBe("wholesale_profiles");
    expect(mock.captured.update?.row).toMatchObject({
      application_status: "pending",
      company_name: "Perfumería Aurora",
    });
    // A re-apply must not also insert a second row.
    expect(mock.captured.insert).toBeUndefined();
  });

  it("rejects invalid input before touching the database", async () => {
    const mock = setup({ user: { id: "u1" }, profileRole: "customer" });
    const res = await applyForWholesaleAction({ ...validInput, company_name: "A" });
    expect(res.ok).toBe(false);
    expect(mock.captured.insert).toBeUndefined();
  });

  it("surfaces a DB insert failure as a friendly error", async () => {
    setup({
      user: { id: "u1" },
      profileRole: "customer",
      insertError: { message: "duplicate key value" },
    });
    const res = await applyForWholesaleAction(validInput);
    expect(res.ok).toBe(false);
    expect(res.message).toMatch(/no pudimos/i);
  });
});
