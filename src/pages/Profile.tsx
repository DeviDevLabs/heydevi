import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    weight_kg: "",
    height_cm: "",
    age: "",
    sex: "female",
    activity_level: "high",
    training_time: "06:00",
    protein_target: "100",
    calorie_target: "",
  });

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setForm({
            weight_kg: data.weight_kg?.toString() || "",
            height_cm: data.height_cm?.toString() || "",
            age: data.age?.toString() || "",
            sex: data.sex || "female",
            activity_level: data.activity_level || "high",
            training_time: data.training_time || "06:00",
            protein_target: data.protein_target?.toString() || "100",
            calorie_target: data.calorie_target?.toString() || "",
          });
        }
        setLoading(false);
      });
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = {
      user_id: user.id,
      weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
      height_cm: form.height_cm ? Number(form.height_cm) : null,
      age: form.age ? Number(form.age) : null,
      sex: form.sex,
      activity_level: form.activity_level,
      training_time: form.training_time,
      protein_target: Number(form.protein_target) || 100,
      calorie_target: form.calorie_target ? Number(form.calorie_target) : null,
    };

    const { error } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "user_id" });

    setSaving(false);
    if (error) {
      toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil guardado" });
    }
  };

  if (loading) return <p className="text-muted-foreground text-sm p-4">Cargando perfil...</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-serif">Perfil</h1>
        <p className="text-muted-foreground text-sm mt-1">Tus datos y metas nutricionales</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Datos corporales</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Peso (kg)</Label>
              <Input type="number" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} placeholder="57" />
            </div>
            <div className="space-y-1">
              <Label>Altura (cm)</Label>
              <Input type="number" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} placeholder="159" />
            </div>
            <div className="space-y-1">
              <Label>Edad</Label>
              <Input type="number" value={form.age} onChange={(e) => setForm({ ...form, age: e.target.value })} placeholder="30" />
            </div>
            <div className="space-y-1">
              <Label>Sexo</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.sex} onChange={(e) => setForm({ ...form, sex: e.target.value })}>
                <option value="female">Mujer</option>
                <option value="male">Hombre</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Metas y entrenamiento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Proteina objetivo (g/dia)</Label>
              <Input type="number" value={form.protein_target} onChange={(e) => setForm({ ...form, protein_target: e.target.value })} placeholder="100" />
            </div>
            <div className="space-y-1">
              <Label>Calorias objetivo</Label>
              <Input type="number" value={form.calorie_target} onChange={(e) => setForm({ ...form, calorie_target: e.target.value })} placeholder="Opcional" />
            </div>
            <div className="space-y-1">
              <Label>Hora de entreno</Label>
              <Input type="time" value={form.training_time} onChange={(e) => setForm({ ...form, training_time: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Nivel actividad</Label>
              <select className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.activity_level} onChange={(e) => setForm({ ...form, activity_level: e.target.value })}>
                <option value="low">Bajo</option>
                <option value="moderate">Moderado</option>
                <option value="high">Alto</option>
                <option value="very_high">Muy alto</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? "Guardando..." : "Guardar perfil"}
      </Button>
    </div>
  );
};

export default Profile;
