import { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { lovable } from "@/integrations/lovable/index";

const Auth = () => {
  const { user, loading, signIn, signUp } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const { toast } = useToast();

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><p className="text-muted-foreground">Cargando...</p></div>;
  if (user) return <Navigate to="/" replace />;

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

  const handleEmailAuth = async (type: "signin" | "signup") => {
    if (!email || !password) {
      toast({ title: "Error", description: "Por favor, completa todos los campos", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = type === "signin" ? await signIn(email, password) : await signUp(email, password);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else if (type === "signup") {
      toast({ title: "Registro exitoso", description: "Revisa tu correo para confirmar tu cuenta" });
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
            <CardTitle className="text-xl">Bienvenido</CardTitle>
            <CardDescription>
              Inicia sesión o regístrate para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={mode} onValueChange={setMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>
              
              <div className="mt-4 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="tu@email.com" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>

              <TabsContent value="signin" className="mt-4">
                <Button
                  type="button"
                  className="w-full"
                  disabled={submitting}
                  onClick={() => handleEmailAuth("signin")}
                >
                  {submitting ? "Cargando..." : "Iniciar sesión"}
                </Button>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-4">
                <Button
                  type="button"
                  className="w-full"
                  disabled={submitting}
                  onClick={() => handleEmailAuth("signup")}
                >
                  {submitting ? "Cargando..." : "Crear cuenta"}
                </Button>
              </TabsContent>
            </Tabs>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">O también</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={submitting}
              onClick={handleGoogleLogin}
            >
              Continuar con Google
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
