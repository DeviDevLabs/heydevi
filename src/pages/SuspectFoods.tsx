import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, AlertCircle } from "lucide-react";

type SuspectFood = {
  id: string;
  food_name: string;
  eaten_date: string;
  notes: string | null;
  created_at: string;
};

const SuspectFoods = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const todayStr = new Date().toISOString().split("T")[0];

  const [foods, setFoods] = useState<SuspectFood[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [foodName, setFoodName] = useState("");
  const [eatenDate, setEatenDate] = useState(todayStr);
  const [notes, setNotes] = useState("");

  const loadFoods = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("suspect_foods")
      .select("*")
      .eq("user_id", user.id)
      .order("eaten_date", { ascending: false });
    setFoods((data as SuspectFood[]) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadFoods();
  }, [loadFoods]);

  const handleAdd = async () => {
    if (!user || !foodName.trim()) return;
    setSaving(true);
    const { error } = await supabase.from("suspect_foods").insert({
      user_id: user.id,
      food_name: foodName.trim(),
      eaten_date: eatenDate,
      notes: notes.trim() || null,
    } as any);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setFoodName("");
      setNotes("");
      loadFoods();
      toast({ title: "Registrado" });
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("¿Eliminar este alimento sospechoso?")) return;
    const { error } = await supabase.from("suspect_foods").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      loadFoods();
      toast({ title: "Eliminado" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <AlertCircle className="h-7 w-7 text-destructive opacity-60" />
        <div>
          <h1 className="text-2xl font-bold font-serif">Alimentos Sospechosos</h1>
          <p className="text-muted-foreground text-sm">Registra alimentos que te causaron más hinchazón de lo normal</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Plus className="h-4 w-4" /> Agregar alimento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Alimento</Label>
              <Input
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                placeholder="Ej: Brócoli, lentejas…"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fecha</Label>
              <Input
                type="date"
                value={eatenDate}
                onChange={(e) => setEatenDate(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas (opcional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="¿Qué síntomas notaste? ¿Cuánto comiste?"
              rows={2}
            />
          </div>
          <Button onClick={handleAdd} disabled={saving || !foodName.trim()} className="w-full">
            {saving ? "Guardando..." : "Registrar"}
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <h2 className="font-semibold text-lg">Historial</h2>
        {loading ? (
          <p className="text-muted-foreground text-sm">Cargando...</p>
        ) : foods.length === 0 ? (
          <Card>
            <CardContent className="p-4 text-center text-muted-foreground text-sm">
              No has registrado alimentos sospechosos aún 🎉
            </CardContent>
          </Card>
        ) : (
          foods.map((f) => (
            <Card key={f.id}>
              <CardContent className="p-3 flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <p className="font-medium text-sm">{f.food_name}</p>
                  <p className="text-xs text-muted-foreground">{f.eaten_date}</p>
                  {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => handleDelete(f.id)}>
                  <Trash2 className="w-3 h-3 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SuspectFoods;
