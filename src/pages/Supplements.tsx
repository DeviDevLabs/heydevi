import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, History, Edit } from "lucide-react";

// ── Types ──────────────────────────────────────────────
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

// ── Default supplements (source of truth) ──────────────
type DefaultSup = {
  key: string;
  name: string;
  form: string;
  dose_value: number;
  dose_unit: string;
  frequency: string;
  time_of_day?: string;
  notes?: string;
  inventory_initial_amount?: number;
};

const DEFAULT_SUPPLEMENTS: DefaultSup[] = [
  {
    key: "creatina",
    name: "Creatina monohidrato",
    form: "powder",
    dose_value: 5,
    dose_unit: "g",
    frequency: "daily",
    time_of_day: "07:00",
    notes: "Post-entreno. Mezclar con agua o batido.",
    inventory_initial_amount: 5,
  },
  {
    key: "d3k2",
    name: "Vitamina D3 + K2",
    form: "caps",
    dose_value: 2000,
    dose_unit: "UI",
    frequency: "daily",
    notes: "Con desayuno. Incluye K2 100 mcg.",
    inventory_initial_amount: 2000,
  },
  {
    key: "b12",
    name: "B12 metilcobalamina",
    form: "caps",
    dose_value: 1000,
    dose_unit: "mcg",
    frequency: "mon-wed-fri",
    notes: "Por la mañana. Esencial en dieta vegetariana.",
    inventory_initial_amount: 1000,
  },
  {
    key: "omega3",
    name: "Omega-3 de algas (DHA+EPA)",
    form: "caps",
    dose_value: 500,
    dose_unit: "mg",
    frequency: "daily",
    notes: "Con desayuno. Rango 250–500 mg.",
    inventory_initial_amount: 500,
  },
  {
    key: "vitc",
    name: "Vitamina C",
    form: "caps",
    dose_value: 500,
    dose_unit: "mg",
    frequency: "daily",
    notes: "Media mañana o comida. Evitar justo antes/después del entreno.",
    inventory_initial_amount: 500,
  },
  {
    key: "magnesio",
    name: "Magnesio glicinato",
    form: "caps",
    dose_value: 400,
    dose_unit: "mg",
    frequency: "daily",
    time_of_day: "21:00",
    notes: "Antes de dormir (21:00–21:30). Pausar si causa molestias GI.",
    inventory_initial_amount: 400,
  },
];

// ── Component ──────────────────────────────────────────
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

  // ── Precarga: ensure defaults exist ──────────────────
  const ensureDefaultSupplements = useCallback(async () => {
    if (!user) return;

    const { data: existing, error: exErr } = await supabase
      .from("user_supplements")
      .select("id,name")
      .eq("user_id", user.id);

    if (exErr) return;

    const existingByName = new Map(
      (existing || []).map((s: any) => [String(s.name).trim().toLowerCase(), s])
    );

    const today = new Date().toISOString().split("T")[0];

    for (const def of DEFAULT_SUPPLEMENTS) {
      const key = def.name.trim().toLowerCase();
      if (existingByName.has(key)) continue;

      const { data: sup, error: insErr } = await supabase
        .from("user_supplements")
        .insert({
          user_id: user.id,
          name: def.name,
          brand: null,
          form: def.form,
          default_unit: def.dose_unit,
          notes: def.notes || null,
          active: true,
        })
        .select("id")
        .single();

      if (insErr || !sup) continue;

      await supabase.from("supplement_regimens").insert({
        user_id: user.id,
        supplement_id: sup.id,
        start_date: today,
        end_date: null,
        dose_value: def.dose_value,
        dose_unit: def.dose_unit,
        frequency: def.frequency,
        time_of_day: def.time_of_day || null,
      });
    }
  }, [user]);

  // ── Sync supplements → inventory ─────────────────────
  const ensureSupplementsInInventory = useCallback(async () => {
    if (!user) return;

    const { data: sups } = await supabase
      .from("user_supplements")
      .select("id,name,default_unit,active")
      .eq("user_id", user.id);

    if (!sups?.length) return;

    const defByName = new Map(
      DEFAULT_SUPPLEMENTS.map((d) => [d.name.trim().toLowerCase(), d])
    );

    for (const s of sups as any[]) {
      const sName = String(s.name || "").trim();
      if (!sName) continue;

      const def = defByName.get(sName.toLowerCase());

      await supabase.from("inventory").upsert(
        {
          user_id: user.id,
          ingredient_name: sName,
          category: "suplementos",
          grams_available: def?.inventory_initial_amount ?? 0,
          food_item_id: null,
          item_type: "supplement",
          unit: def?.dose_unit ?? s.default_unit ?? "caps",
        },
        { onConflict: "user_id,ingredient_name" }
      );
    }
  }, [user]);

  // ── Init: precarga + load ────────────────────────────
  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      await ensureDefaultSupplements();
      await ensureSupplementsInInventory();
      await load();
    })();
  }, [user, ensureDefaultSupplements, ensureSupplementsInInventory, load]);

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
