import { describe, it, expect, vi, beforeEach } from "vitest";
import { makeSupabaseMock, type SupabaseMockConfig } from "@/test/helpers/supabaseMock";

// Delegate the singleton browser client to whatever client the current test set.
const { state } = vi.hoisted(() => ({
  state: { client: undefined as ReturnType<typeof makeSupabaseMock>["client"] | undefined },
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    auth: { getUser: (...a: unknown[]) => state.client!.auth.getUser(...a) },
    from: (...a: unknown[]) => state.client!.from(...a),
    rpc: (...a: unknown[]) => state.client!.rpc(...a),
  },
}));

import { getWholesaleEligibility } from "./wholesaleProfile";
import { toApplicationStatus } from "@/types/wholesale";

function use(config: SupabaseMockConfig) {
  state.client = makeSupabaseMock(config).client;
}

describe("getWholesaleEligibility", () => {
  beforeEach(() => vi.clearAllMocks());

  it("is approved only when role is wholesale AND application is approved", async () => {
    use({ profileRole: "wholesale", existingApplication: { application_status: "approved" } });
    const e = await getWholesaleEligibility("u1");
    expect(e).toEqual({ isApproved: true, role: "wholesale", status: "approved" });
  });

  it("is NOT approved when the role is wholesale but the application is still pending", async () => {
    use({ profileRole: "wholesale", existingApplication: { application_status: "pending" } });
    const e = await getWholesaleEligibility("u1");
    expect(e.isApproved).toBe(false);
    expect(e.status).toBe("pending");
  });

  it("is NOT approved when the application is approved but the role is still customer", async () => {
    use({ profileRole: "customer", existingApplication: { application_status: "approved" } });
    const e = await getWholesaleEligibility("u1");
    expect(e.isApproved).toBe(false);
    expect(e.role).toBe("customer");
  });

  it("is NOT approved when there is no application at all", async () => {
    use({ profileRole: "customer", existingApplication: null });
    const e = await getWholesaleEligibility("u1");
    expect(e.isApproved).toBe(false);
    expect(e.status).toBeNull();
  });
});

describe("toApplicationStatus", () => {
  it("passes through valid statuses", () => {
    expect(toApplicationStatus("pending")).toBe("pending");
    expect(toApplicationStatus("approved")).toBe("approved");
    expect(toApplicationStatus("rejected")).toBe("rejected");
  });

  it("maps unknown/empty values to null", () => {
    expect(toApplicationStatus(null)).toBeNull();
    expect(toApplicationStatus(undefined)).toBeNull();
    expect(toApplicationStatus("banana")).toBeNull();
  });
});
