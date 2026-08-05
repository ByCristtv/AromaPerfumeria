import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Hoisted mocks so the module factories can reference them.
const { pushMock, actionMock, swalFireMock } = vi.hoisted(() => ({
  pushMock: vi.fn(),
  actionMock: vi.fn(),
  swalFireMock: vi.fn().mockResolvedValue({ isConfirmed: true }),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: pushMock }) }));
vi.mock("@/app/wholesale/actions", () => ({ applyForWholesaleAction: actionMock }));
vi.mock("sweetalert2", () => ({ default: { fire: swalFireMock } }));

import WholesaleApplicationForm from "./WholesaleApplicationForm";

function renderForm() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <WholesaleApplicationForm />
    </QueryClientProvider>
  );
}

describe("WholesaleApplicationForm", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders the required fields", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText(/Perfumería Aurora/i)
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/3-101-123456/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /enviar solicitud/i })
    ).toBeInTheDocument();
  });

  it("shows validation errors and does NOT submit when fields are empty", async () => {
    const user = userEvent.setup();
    renderForm();

    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    expect(
      await screen.findByText(/Ingresa el nombre de tu empresa/i)
    ).toBeInTheDocument();
    expect(actionMock).not.toHaveBeenCalled();
  });

  it("submits the entered values, then redirects to /profile on success", async () => {
    actionMock.mockResolvedValue({ ok: true, message: "¡Solicitud enviada!" });
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText(/Perfumería Aurora/i),
      "Distribuidora El Aroma"
    );
    await user.type(screen.getByPlaceholderText(/3-101-123456/i), "3-101-654321");
    await user.type(
      screen.getByPlaceholderText(/Venta al detalle/i),
      "Venta mayorista de perfumes"
    );

    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(actionMock).toHaveBeenCalledTimes(1));
    expect(actionMock).toHaveBeenCalledWith({
      company_name: "Distribuidora El Aroma",
      tax_id: "3-101-654321",
      business_activity: "Venta mayorista de perfumes",
      website: "",
    });
    await waitFor(() => expect(pushMock).toHaveBeenCalledWith("/profile"));
  });

  it("does not redirect when the action fails", async () => {
    actionMock.mockResolvedValue({ ok: false, message: "Ya tienes una solicitud." });
    const user = userEvent.setup();
    renderForm();

    await user.type(
      screen.getByPlaceholderText(/Perfumería Aurora/i),
      "Distribuidora El Aroma"
    );
    await user.type(screen.getByPlaceholderText(/3-101-123456/i), "3-101-654321");
    await user.type(
      screen.getByPlaceholderText(/Venta al detalle/i),
      "Venta mayorista de perfumes"
    );

    await user.click(screen.getByRole("button", { name: /enviar solicitud/i }));

    await waitFor(() => expect(actionMock).toHaveBeenCalledTimes(1));
    expect(pushMock).not.toHaveBeenCalled();
  });
});
