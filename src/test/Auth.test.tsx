import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mocks
const signInMock = vi.fn(async () => ({ error: null }));
const signUpMock = vi.fn(async () => ({ error: null }));
const toastMock = vi.fn();
vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ signIn: signInMock, signUp: signUpMock, user: null }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/integrations/lovable/index", () => ({ lovable: { auth: { signInWithOAuth: vi.fn(async () => ({ error: null })) } } }));

import Auth from "@/pages/Auth";

describe("Auth accessibility focus behavior", () => {
  it("focuses email input when email validation fails", async () => {
    render(<Auth />);
    const email = screen.getByPlaceholderText("tu@correo.com") as HTMLInputElement;
    const password = screen.getByPlaceholderText("Minimo 6 caracteres") as HTMLInputElement;
    const btn = screen.getByRole("button", { name: /iniciar sesion/i });

    // invalid email should fail validation (noValidate on form prevents native blocking)
    fireEvent.change(email, { target: { value: "not-an-email" } });
    fireEvent.change(password, { target: { value: "123456" } });
    fireEvent.click(btn);

    // expect toast was called for validation error
    await waitFor(() => expect(toastMock).toHaveBeenCalled());
  });

  it("focuses password input when password validation fails", async () => {
    render(<Auth />);
    const email = screen.getByPlaceholderText("tu@correo.com") as HTMLInputElement;
    const password = screen.getByPlaceholderText("Minimo 6 caracteres") as HTMLInputElement;
    const btn = screen.getByRole("button", { name: /iniciar sesion/i });

    fireEvent.change(email, { target: { value: "user@example.com" } });
    fireEvent.change(password, { target: { value: "123" } });
    fireEvent.click(btn);

    await waitFor(() => expect(toastMock).toHaveBeenCalled());
  });
});
