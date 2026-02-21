import React, { act } from "react";
// @ts-expect-error - testing-library types not fully installed
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mocks
const signInMock = vi.fn(async () => ({ error: null }));
const signUpMock = vi.fn(async () => ({ error: null }));
const toastMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({ 
  useAuth: () => ({ 
    signIn: signInMock, 
    signUp: signUpMock, 
    user: null, 
    loading: false 
  }) 
}));

vi.mock("@/hooks/use-toast", () => ({ 
  useToast: () => ({ toast: toastMock }) 
}));

vi.mock("react-router-dom", () => ({ 
  Navigate: ({ to }: { to: string }) => <div>Redirect to {to}</div>
}));

vi.mock("@/integrations/lovable/index", () => {
  const f = vi.fn(async () => ({ error: null }));
  return { lovable: { auth: { signInWithOAuth: f } } };
});

import Auth from "@/pages/Auth";

describe("Auth Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders login form and handles Google login", async () => {
    await act(async () => {
      render(<Auth />);
    });
    
    expect(screen.getByText(/Bienvenido/i)).toBeTruthy();
    
    const googleBtn = screen.getByRole("button", { name: /continuar con google/i });
    expect(googleBtn).toBeTruthy();
    
    await act(async () => {
      fireEvent.click(googleBtn);
    });
  });

  it("handles email/password login", async () => {
    await act(async () => {
      render(<Auth />);
    });
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    const loginBtn = screen.getByRole("button", { name: /^Iniciar sesión$/i });
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(loginBtn);
    });
    
    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledWith("test@example.com", "password123");
    });
  });

  it("handles email/password signup", async () => {
    await act(async () => {
      render(<Auth />);
    });
    
    // Switch to signup tab
    const signupTab = screen.getByRole("tab", { name: /Registrarse/i });
    await act(async () => {
      // Trying different events to trigger Radix UI Tabs
      fireEvent.mouseDown(signupTab);
      fireEvent.mouseUp(signupTab);
      fireEvent.click(signupTab);
    });
    
    // Check if the tab state changed or just wait for the button
    const signupBtn = await screen.findByRole("button", { name: /Crear cuenta/i });
    expect(signupBtn).toBeTruthy();
    
    const emailInput = screen.getByLabelText(/Email/i);
    const passwordInput = screen.getByLabelText(/Contraseña/i);
    
    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "new@example.com" } });
      fireEvent.change(passwordInput, { target: { value: "password123" } });
      fireEvent.click(signupBtn);
    });
    
    await waitFor(() => {
      expect(signUpMock).toHaveBeenCalledWith("new@example.com", "password123");
    });
  });
});
