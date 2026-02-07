import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, History, Edit } from "lucide-react";

interface UserSupplement {
  id: string;
  name: string;
  brand: string | null;
  form: string;
  default_unit: string;
  notes: string | null;
  active: boolean;
}

interface Regimen {
  id: string;
  supplement_id: string;
  start_date: string;
  end_date: string | null;
  dose_value: number;
  dose_unit: string;
  frequency: string;
  time_of_day: string | null;
}

const Supplements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [supplements, setSupplements] = useState<UserSupplement[]>([]);
  const [regimens, setRegimens] = useState<Regimen[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [editingRegimen, setEditingRegimen] = useState<string | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);

  // Add form
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [form, setForm] = useState("caps");
  const [doseValue, setDoseValue] = useState("");
  const [doseUnit, setDoseUnit] = useState("mg");
  const [frequency, setFrequency] = useState("daily");
  const [timeOfDay, setTimeOfDay] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const [{ data: sups }, { data: regs }] = await Promise.all([
      supabase.from("user_supplements").select("*").eq("user_id", user.id).order("active", { ascending: false }),
      supabase.from("supplement_regimens").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    ]);
    setSupplements((sups as UserSupplement[]) || []);
    setRegimens((regs as Regimen[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => {
    setName(""); setBrand(""); setForm("caps"); setDoseValue("");
    setDoseUnit("mg"); setFrequency("daily"); setTimeOfDay("");
    setStartDate(new Date().toISOString().split("T")[0]);
    setShowAdd(false); setEditingRegimen(null);
  };

  const handleAddSupplement = async () => {
    if (!user || !name.trim() || !doseValue) return;
    const { data: sup, error } = await supabase
      .from("user_supplements")
      .insert({ user_id: user.id, name: name.trim(), brand: brand || null, form, default_unit: doseUnit })
      .select("id")
      .single();
    if (error || !sup) {
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }
    await supabase.from("supplement_regimens").insert({
      user_id: user.id,
      supplement_id: sup.id,
      start_date: startDate,
      dose_value: Number(doseValue),
      dose_unit: doseUnit,
      frequency,
      time_of_day: timeOfDay || null,
    });
    resetForm();
    load();
  };

  const handleNewRegimen = async (supplementId: string) => {
    if (!user || !doseValue) return;
    // Close current active regimen
    const currentRegimen = regimens.find(
      (r) => r.supplement_id === supplementId && !r.end_date
    );
    if (currentRegimen) {
      await supabase.from("supplement_regimens")
        .update({ end_date: startDate })
        .eq("id", currentRegimen.id);
    }
    await supabase.from("supplement_regimens").insert({
      user_id: user.id,
      supplement_id: supplementId,
      start_date: startDate,
      dose_value: Number(doseValue),
      dose_unit: doseUnit,
      frequency,
      time_of_day: timeOfDay || null,
    });
    resetForm();
    load();
  };

  const toggleActive = async (sup: UserSupplement) => {
    await supabase.from("user_supplements").update({ active: !sup.active }).eq("id", sup.id);
    load();
  };

  const getActiveRegimen = (supId: string) =>
    regimens.find((r) => r.supplement_id === supId && !r.end_date);

  const getHistory = (supId: string) =>
    regimens.filter((r) => r.supplement_id === supId);

  if (loading) return <p className="text-muted-foreground text-sm p-4">Cargando suplementos...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Suplementos</h1>
          <p className="text-muted-foreground text-sm mt-1">Historial de dosis y cambios</p>
        </div>
        <Button size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="w-4 h-4 mr-1" /> Agregar
        </Button>
      </div>

      {showAdd && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Nuevo suplemento</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Nombre (ej. Magnesio glicinato)" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="Marca (opcional)" value={brand} onChange={(e) => setBrand(e.target.value)} />
            <div className="grid grid-cols-3 gap-2">
              <select className="h-10 px-2 rounded-md border border-input bg-background text-sm" value={form} onChange={(e) => setForm(e.target.value)}>
                <option value="caps">Cápsulas</option>
                <option value="powder">Polvo</option>
                <option value="liquid">Líquido</option>
                <option value="tablet">Tableta</option>
              </select>
              <Input type="number" placeholder="Dosis" value={doseValue} onChange={(e) => setDoseValue(e.target.value)} />
              <select className="h-10 px-2 rounded-md border border-input bg-background text-sm" value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)}>
                <option value="mg">mg</option>
                <option value="mcg">mcg</option>
                <option value="g">g</option>
                <option value="UI">UI</option>
                <option value="ml">ml</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <select className="h-10 px-2 rounded-md border border-input bg-background text-sm" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="3x-week">3x/semana</option>
                <option value="as-needed">Según necesidad</option>
              </select>
              <Input type="time" placeholder="Hora" value={timeOfDay} onChange={(e) => setTimeOfDay(e.target.value)} />
            </div>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Button onClick={handleAddSupplement} className="w-full" disabled={!name.trim() || !doseValue}>
              Guardar suplemento
            </Button>
          </CardContent>
        </Card>
      )}

      {supplements.length === 0 && !showAdd && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Sin suplementos registrados. Usa el botón Agregar.
        </p>
      )}

      {supplements.map((sup) => {
        const active = getActiveRegimen(sup.id);
        const history = getHistory(sup.id);
        const showingHistory = historyFor === sup.id;
        const showingEdit = editingRegimen === sup.id;

        return (
          <Card key={sup.id} className={sup.active ? "" : "opacity-60"}>
            <CardContent className="p-4 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm">{sup.name}</h3>
                  {sup.brand && <p className="text-xs text-muted-foreground">{sup.brand}</p>}
                  {active && (
                    <p className="text-sm mt-1">
                      {active.dose_value} {active.dose_unit} — {active.frequency}
                      {active.time_of_day && ` a las ${active.time_of_day}`}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Switch checked={sup.active} onCheckedChange={() => toggleActive(sup)} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm" variant="outline"
                  onClick={() => {
                    if (showingEdit) { resetForm(); } else {
                      setEditingRegimen(sup.id);
                      if (active) { setDoseValue(String(active.dose_value)); setDoseUnit(active.dose_unit); setFrequency(active.frequency); setTimeOfDay(active.time_of_day || ""); }
                      setStartDate(new Date().toISOString().split("T")[0]);
                    }
                  }}
                  className="text-xs"
                >
                  <Edit className="w-3 h-3 mr-1" /> Cambiar dosis
                </Button>
                <Button
                  size="sm" variant="ghost"
                  onClick={() => setHistoryFor(showingHistory ? null : sup.id)}
                  className="text-xs"
                >
                  <History className="w-3 h-3 mr-1" /> Historial ({history.length})
                </Button>
              </div>

              {showingEdit && (
                <div className="border rounded-md p-3 space-y-2 mt-2">
                  <p className="text-xs font-medium">Nueva dosis (crea nuevo regimen)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Input type="number" placeholder="Dosis" value={doseValue} onChange={(e) => setDoseValue(e.target.value)} />
                    <select className="h-10 px-2 rounded-md border border-input bg-background text-sm" value={doseUnit} onChange={(e) => setDoseUnit(e.target.value)}>
                      <option value="mg">mg</option><option value="mcg">mcg</option><option value="g">g</option><option value="UI">UI</option><option value="ml">ml</option>
                    </select>
                    <select className="h-10 px-2 rounded-md border border-input bg-background text-sm" value={frequency} onChange={(e) => setFrequency(e.target.value)}>
                      <option value="daily">Diario</option><option value="weekly">Semanal</option><option value="3x-week">3x/sem</option><option value="as-needed">S/N</option>
                    </select>
                  </div>
                  <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                  <Button size="sm" onClick={() => handleNewRegimen(sup.id)} disabled={!doseValue}>
                    Guardar nuevo regimen
                  </Button>
                </div>
              )}

              {showingHistory && (
                <div className="mt-2 space-y-1">
                  {history.map((r) => (
                    <div key={r.id} className="text-xs flex items-center gap-2 text-muted-foreground">
                      <Badge variant={r.end_date ? "outline" : "secondary"} className="text-xs">
                        {r.dose_value} {r.dose_unit}
                      </Badge>
                      <span>{r.frequency}</span>
                      <span>{r.start_date}{r.end_date ? ` → ${r.end_date}` : " → actual"}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default Supplements;
