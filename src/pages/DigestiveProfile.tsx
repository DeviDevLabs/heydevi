import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { TRIGGER_OPTIONS } from "@/lib/digestiveUtils";
import { ClipboardList, BarChart3 } from "lucide-react";

const FIBER_LEVELS = [
  { value: "bajo", label: "Bajo" },
  { value: "medio", label: "Medio" },
  { value: "alto", label: "Alto" },
];

const DigestiveProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    lactose_sensitive: false,
    gluten_sensitive: false,
    fiber_tolerance: "medio",
    triggers: [] as string[],
    problem_foods: "",
    notes: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("digestive_profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            lactose_sensitive: data.lactose_sensitive ?? false,
            gluten_sensitive: data.gluten_sensitive ?? false,
            fiber_tolerance: data.fiber_tolerance ?? "medio",
            triggers: (data.triggers as string[]) ?? [],
            problem_foods: ((data.problem_foods as string[]) ?? []).join(", "),
            notes: data.notes ?? "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const toggleTrigger = (trigger: string) => {
    setForm((prev) => ({
      ...prev,
      triggers: prev.triggers.includes(trigger)
        ? prev.triggers.filter((t) => t !== trigger)
        : [...prev.triggers, trigger],
    }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      lactose_sensitive: form.lactose_sensitive,
      gluten_sensitive: form.gluten_sensitive,
      fiber_tolerance: form.fiber_tolerance,
      triggers: form.triggers,
      problem_foods: form.problem_foods
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      notes: form.notes || null,
    };

    const { error } = await supabase
      .from("digestive_profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil digestivo guardado" });
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm p-4">Cargando perfil digestivo...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Perfil Digestivo</h1>
        <p className="text-muted-foreground text-sm mt-1">Configura tus sensibilidades y gatillantes</p>
      </div>

      <div className="flex gap-2">
        <Link to="/digestion/registro">
          <Button variant="outline" size="sm" className="gap-1.5">
            <ClipboardList className="w-4 h-4" />
            Registro diario
          </Button>
        </Link>
        <Link to="/digestion/estadisticas">
          <Button variant="outline" size="sm" className="gap-1.5">
            <BarChart3 className="w-4 h-4" />
            Estadísticas
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Sensibilidades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Checkbox
              id="lactose"
              checked={form.lactose_sensitive}
              onCheckedChange={(v) => setForm({ ...form, lactose_sensitive: !!v })}
            />
            <Label htmlFor="lactose">Sensibilidad a lácteos</Label>
          </div>
          <div className="flex items-center gap-3">
            <Checkbox
              id="gluten"
              checked={form.gluten_sensitive}
              onCheckedChange={(v) => setForm({ ...form, gluten_sensitive: !!v })}
            />
            <Label htmlFor="gluten">Sensibilidad a gluten</Label>
          </div>

          <div className="space-y-1">
            <Label>Tolerancia a fibra</Label>
            <div className="flex gap-2">
              {FIBER_LEVELS.map((fl) => (
                <Button
                  key={fl.value}
                  size="sm"
                  variant={form.fiber_tolerance === fl.value ? "default" : "outline"}
                  onClick={() => setForm({ ...form, fiber_tolerance: fl.value })}
                >
                  {fl.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gatillantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {TRIGGER_OPTIONS.map((trigger) => (
              <Button
                key={trigger}
                size="sm"
                variant={form.triggers.includes(trigger) ? "default" : "outline"}
                onClick={() => toggleTrigger(trigger)}
                className="text-xs"
              >
                {trigger}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Comidas problemáticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Lista separada por comas</Label>
            <Textarea
              value={form.problem_foods}
              onChange={(e) => setForm({ ...form, problem_foods: e.target.value })}
              placeholder="ej: brócoli crudo, frijoles negros, pan blanco"
              rows={2}
            />
          </div>
          <div className="space-y-1">
            <Label>Notas adicionales</Label>
            <Textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Cualquier observación sobre tu digestión..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Guardando..." : "Guardar perfil digestivo"}
      </Button>
    </div>
  );
};

export default DigestiveProfile;
