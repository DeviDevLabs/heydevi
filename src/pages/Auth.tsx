import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";
import { lovable } from "@/integrations/lovable/index";

const emailSchema = z.string().trim().email("Correo electronico invalido").max(255);
const passwordSchema = z.string().min(6, "La contrasena debe tener al menos 6 caracteres").max(72);

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // If already logged in, allow navigating away but don't force redirect

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      toast({ title: "Error", description: emailResult.error.errors[0].message, variant: "destructive" });
      return;
    }
    const passResult = passwordSchema.safeParse(password);
    if (!passResult.success) {
      toast({ title: "Error", description: passResult.error.errors[0].message, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await signIn(emailResult.data, password);
        if (error) {
          const msg = error.message.includes("Invalid login")
            ? "Correo o contrasena incorrectos"
            : error.message;
          toast({ title: "Error al iniciar sesion", description: msg, variant: "destructive" });
        }
      } else {
        const { error } = await signUp(emailResult.data, password);
        if (error) {
          const msg = error.message.includes("already registered")
            ? "Este correo ya esta registrado. Intenta iniciar sesion."
            : error.message;
          toast({ title: "Error al registrarse", description: msg, variant: "destructive" });
        } else {
          toast({
            title: "Cuenta creada",
            description: "Revisa tu correo para confirmar tu cuenta antes de iniciar sesion.",
          });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="font-serif text-3xl font-bold text-primary">Nutriologo Pro</h1>
          <p className="text-muted-foreground text-sm mt-2">
            Planificador nutricional profesional
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isLogin ? "Iniciar sesion" : "Crear cuenta"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo electronico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Contrasena</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Minimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting
                  ? "Procesando..."
                  : isLogin
                  ? "Iniciar sesion"
                  : "Crear cuenta"}
              </Button>
            </form>
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">o</span></div>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={submitting}
              onClick={async () => {
                setSubmitting(true);
                const { error } = await lovable.auth.signInWithOAuth("google", {
                  redirect_uri: window.location.origin,
                });
                if (error) {
                  toast({ title: "Error con Google", description: error.message, variant: "destructive" });
                }
                setSubmitting(false);
              }}
            >
              Continuar con Google
            </Button>
            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="text-sm text-primary hover:underline"
              >
                {isLogin
                  ? "No tienes cuenta? Registrate"
                  : "Ya tienes cuenta? Inicia sesion"}
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
