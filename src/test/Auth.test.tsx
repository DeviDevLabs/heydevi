import React from "react";
// @ts-expect-error - testing-library types not fully installed
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

// Mocks
const signInMock = vi.fn(async () => ({ error: null }));
const signUpMock = vi.fn(async () => ({ error: null }));
const toastMock = vi.fn();

vi.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ signIn: signInMock, signUp: signUpMock, user: null, loading: false }) }));
vi.mock("@/hooks/use-toast", () => ({ useToast: () => ({ toast: toastMock }) }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("@/integrations/lovable/index", () => {
  const f = vi.fn(async () => ({ error: null }));
  (globalThis as any).__oauthMock = f;
  return { lovable: { auth: { signInWithOAuth: f } } };
});

import Auth from "@/pages/Auth";

describe("Auth Google login", () => {
  it("renders Google button and triggers OAuth on click", async () => {
    render(<Auth />);
    const btn = screen.getByRole("button", { name: /continuar con google/i });
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    await waitFor(() => expect((globalThis as any).__oauthMock).toHaveBeenCalled());
  });
});
