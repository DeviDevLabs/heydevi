import { useState, useEffect, useCallback, useMemo } from "react";
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

// ── Normalize helper ───────────────────────────────────
const normName = (n: string) => n.trim().toLowerCase();

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
  { key: "creatina", name: "Creatina monohidrato", form: "powder", dose_value: 5, dose_unit: "g", frequency: "daily", time_of_day: "07:00", notes: "Post-entreno. Mezclar con agua o batido.", inventory_initial_amount: 5 },
  { key: "d3k2", name: "Vitamina D3 + K2", form: "caps", dose_value: 2000, dose_unit: "UI", frequency: "daily", notes: "Con desayuno. Incluye K2 100 mcg.", inventory_initial_amount: 2000 },
  { key: "b12", name: "B12 metilcobalamina", form: "caps", dose_value: 1000, dose_unit: "mcg", frequency: "mon-wed-fri", notes: "Por la mañana. Esencial en dieta vegetariana.", inventory_initial_amount: 1000 },
  { key: "omega3", name: "Omega-3 de algas (DHA+EPA)", form: "caps", dose_value: 500, dose_unit: "mg", frequency: "daily", notes: "Con desayuno. Rango 250–500 mg.", inventory_initial_amount: 500 },
  { key: "vitc", name: "Vitamina C", form: "caps", dose_value: 500, dose_unit: "mg", frequency: "daily", notes: "Media mañana o comida. Evitar justo antes/después del entreno.", inventory_initial_amount: 500 },
  { key: "magnesio", name: "Magnesio glicinato", form: "caps", dose_value: 400, dose_unit: "mg", frequency: "daily", time_of_day: "21:00", notes: "Antes de dormir (21:00–21:30). Pausar si causa molestias GI.", inventory_initial_amount: 400 },
];

// ── Component ──────────────────────────────────────────
const Supplements = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rawSupplements, setRawSupplements] = useState<UserSupplement[]>([]);
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

  // ── Deduplicate supplements by normalized name ───────
  // Keep the one with the most recent regimen (or first created)
  const supplements = useMemo(() => {
    const seen = new Map<string, UserSupplement>();
    // Sort raw supplements so that when we encounter duplicates, we keep
    // the one with the latest regimen activity (determined below via ordering)
    for (const s of rawSupplements) {
      const key = normName(s.name);
      if (!seen.has(key)) {
        seen.set(key, s);
      }
      // If duplicate, keep the one that is active, or the first one
      else {
        const existing = seen.get(key)!;
        if (!existing.active && s.active) {
          seen.set(key, s);
        }
      }
    }
    return Array.from(seen.values());
  }, [rawSupplements]);

  // ── Order supplements by most recent regimen ─────────
  const sortedSupplements = useMemo(() => {
    const latestRegimenDate = new Map<string, string>();
    for (const r of regimens) {
      const current = latestRegimenDate.get(r.supplement_id);
      if (!current || r.start_date > current) {
        latestRegimenDate.set(r.supplement_id, r.start_date);
      }
    }
    return [...supplements].sort((a, b) => {
      // Active first, then by latest regimen date desc
      if (a.active !== b.active) return a.active ? -1 : 1;
      const dateA = latestRegimenDate.get(a.id) || "0000";
      const dateB = latestRegimenDate.get(b.id) || "0000";
      return dateB.localeCompare(dateA);
    });
  }, [supplements, regimens]);

  // ── Collect all duplicate IDs for a normalized name ──
  const duplicateIdsForName = useCallback(
    (normalizedName: string): string[] => {
      return rawSupplements
        .filter((s) => normName(s.name) === normalizedName)
        .map((s) => s.id);
    },
    [rawSupplements]
  );

  // ── Get regimens for a supplement (include duplicates) ──
  const getHistory = useCallback(
    (supId: string, supName: string): Regimen[] => {
      const allIds = new Set(duplicateIdsForName(normName(supName)));
      allIds.add(supId);
      return regimens.filter((r) => allIds.has(r.supplement_id));
    },
    [regimens, duplicateIdsForName]
  );

  const getActiveRegimen = useCallback(
    (supId: string, supName: string): Regimen | undefined => {
      const allIds = new Set(duplicateIdsForName(normName(supName)));
      allIds.add(supId);
      return regimens.find((r) => allIds.has(r.supplement_id) && !r.end_date);
    },
    [regimens, duplicateIdsForName]
  );

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    const [{ data: sups }, { data: regs }] = await Promise.all([
      supabase.from("user_supplements").select("*").eq("user_id", user.id),
      supabase.from("supplement_regimens").select("*").eq("user_id", user.id).order("start_date", { ascending: false }),
    ]);
    setRawSupplements((sups as UserSupplement[]) || []);
    setRegimens((regs as Regimen[]) || []);
    setLoading(false);
  }, [user]);

  // ── Precarga: ensure defaults exist (no duplicates) ──
  const ensureDefaultSupplements = useCallback(async () => {
    if (!user) return;

    const { data: existing, error: exErr } = await supabase
      .from("user_supplements")
      .select("id,name")
      .eq("user_id", user.id);

    if (exErr) return;

    const existingByNorm = new Set(
      (existing || []).map((s: any) => normName(String(s.name)))
    );

    const today = new Date().toISOString().split("T")[0];

    for (const def of DEFAULT_SUPPLEMENTS) {
      if (existingByNorm.has(normName(def.name))) continue;

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

    // Deduplicate: only sync the canonical (first) supplement per normalized name
    const seen = new Set<string>();
    const defByName = new Map(
      DEFAULT_SUPPLEMENTS.map((d) => [normName(d.name), d])
    );

    for (const s of sups as any[]) {
      const norm = normName(String(s.name || ""));
      if (!norm || seen.has(norm)) continue;
      seen.add(norm);

      const def = defByName.get(norm);
      await supabase.from("inventory").upsert(
        {
          user_id: user.id,
          ingredient_name: String(s.name).trim(),
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

  // ── Init ─────────────────────────────────────────────
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

  // ── Add supplement: reuse existing if name matches ───
  const handleAddSupplement = async () => {
    if (!user || !name.trim() || !doseValue) return;
    const norm = normName(name);
    const existing = rawSupplements.find((s) => normName(s.name) === norm);

    let supplementId: string;

    if (existing) {
      // Reuse existing — don't insert duplicate
      supplementId = existing.id;
      // Reactivate if it was inactive
      if (!existing.active) {
        await supabase.from("user_supplements").update({ active: true }).eq("id", existing.id);
      }
    } else {
      // Create new supplement
      const { data: sup, error } = await supabase
        .from("user_supplements")
        .insert({ user_id: user.id, name: name.trim(), brand: brand || null, form, default_unit: doseUnit })
        .select("id")
        .single();
      if (error || !sup) {
        toast({ title: "Error", description: error?.message, variant: "destructive" });
        return;
      }
      supplementId = sup.id;
    }

    // Close any active regimen for this supplement
    const activeReg = regimens.find(
      (r) => r.supplement_id === supplementId && !r.end_date
    );
    if (activeReg) {
      await supabase.from("supplement_regimens")
        .update({ end_date: startDate })
        .eq("id", activeReg.id);
    }

    // Insert new regimen
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

  // ── New regimen for existing supplement ───────────────
  const handleNewRegimen = async (supplementId: string) => {
    if (!user || !doseValue) return;
    // Close active regimen (check all duplicate IDs)
    const sup = rawSupplements.find((s) => s.id === supplementId);
    const allIds = sup ? duplicateIdsForName(normName(sup.name)) : [supplementId];

    for (const id of allIds) {
      const active = regimens.find((r) => r.supplement_id === id && !r.end_date);
      if (active) {
        await supabase.from("supplement_regimens")
          .update({ end_date: startDate })
          .eq("id", active.id);
      }
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

  // ── Toggle active / mark finished ────────────────────
  const toggleActive = async (sup: UserSupplement) => {
    const newActive = !sup.active;
    await supabase.from("user_supplements").update({ active: newActive }).eq("id", sup.id);

    if (!newActive) {
      // Mark finished: close active regimen
      const allIds = duplicateIdsForName(normName(sup.name));
      for (const id of allIds) {
        const active = regimens.find((r) => r.supplement_id === id && !r.end_date);
        if (active) {
          const today = new Date().toISOString().split("T")[0];
          await supabase.from("supplement_regimens")
            .update({ end_date: today })
            .eq("id", active.id);
        }
      }

      // Add to shopping list: set inventory to 0 so it appears as needed
      await supabase.from("inventory").upsert(
        {
          user_id: user!.id,
          ingredient_name: sup.name.trim(),
          category: "suplementos",
          grams_available: 0,
          food_item_id: null,
          item_type: "supplement",
          unit: sup.default_unit || "caps",
        },
        { onConflict: "user_id,ingredient_name" }
      );

      toast({
        title: "Suplemento finalizado",
        description: `${sup.name} añadido a la lista de compra.`,
      });
    }

    load();
  };

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

      {sortedSupplements.length === 0 && !showAdd && (
        <p className="text-center text-muted-foreground text-sm py-8">
          Sin suplementos registrados. Usa el botón Agregar.
        </p>
      )}

      {sortedSupplements.map((sup) => {
        const active = getActiveRegimen(sup.id, sup.name);
        const history = getHistory(sup.id, sup.name);
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
