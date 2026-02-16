import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const { user, loading } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (user) return <Navigate to="/" replace />;

  const isDev = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

  const handleGoogleLogin = async () => {
    setSubmitting(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: globalThis.location.origin,
    });
    if (error) {
      toast({ title: "Error con Google", description: error.message, variant: "destructive" });
    }
    setSubmitting(false);
  };

  const handleDevBypass = async () => {
    setSubmitting(true);
    const email = "dev@localhost.test";
    const password = "dev-bypass-local-only";
    // Try sign in first, then sign up if user doesn't exist
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) {
        toast({ title: "Error de desarrollo", description: signUpError.message, variant: "destructive" });
        setSubmitting(false);
        return;
      }
      // Try sign in again after signup
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Verifica tu email o habilita auto-confirm", description: error.message, variant: "destructive" });
      }
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-primary">GutSync</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Planificador nutricional profesional
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Iniciar sesión</CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              className="w-full"
              disabled={submitting}
              onClick={handleGoogleLogin}
            >
              {submitting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  Procesando...
                </span>
              ) : (
                "Continuar con Google"
              )}
            </Button>
            {isDev && (
              <Button
                type="button"
                variant="outline"
                className="w-full mt-2"
                disabled={submitting}
                onClick={handleDevBypass}
              >
                🛠 Dev Bypass (localhost only)
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
