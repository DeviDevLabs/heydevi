import { useState, useRef, useCallback } from "react";
import { Camera, Loader2, Check, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { getLocalDateStr } from "@/lib/dateUtils";

type DetectedFood = {
  food_name: string;
  estimated_grams: number;
  estimated_calories: number;
  estimated_protein: number;
};

interface MealPhotoAnalyzerProps {
  userId: string;
  onMealSaved?: () => void;
}

const MealPhotoAnalyzer = ({ userId, onMealSaved }: MealPhotoAnalyzerProps) => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [foods, setFoods] = useState<DetectedFood[]>([]);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setPreview(base64);
      setFoods([]);
      setAnalyzing(true);

      try {
        const { data, error } = await supabase.functions.invoke("analyze-meal-photo", {
          body: { image: base64 },
        });

        if (error) throw error;
        if (data?.error) throw new Error(data.error);

        setFoods(data?.foods ?? []);
        if (!data?.foods?.length) {
          toast({ title: "Sin resultados", description: "No se pudieron identificar alimentos en la foto." });
        }
      } catch (err: any) {
        toast({ title: "Error", description: err?.message ?? "Error analizando imagen", variant: "destructive" });
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);

    // Reset input so the same file can be re-selected
    e.target.value = "";
  }, [toast]);

  const handleConfirm = useCallback(async () => {
    if (!foods.length) return;
    setSaving(true);

    const todayStr = getLocalDateStr();
    const now = new Date();
    const timeStr = now.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    const description = foods.map((f) => `${f.food_name} (~${f.estimated_grams}g)`).join(", ");
    const totalProtein = foods.reduce((s, f) => s + f.estimated_protein, 0);
    const totalCalories = foods.reduce((s, f) => s + f.estimated_calories, 0);

    try {
      const { error } = await supabase.from("consumed_meals").insert({
        user_id: userId,
        consumed_date: todayStr,
        meal_label: "📷 Foto",
        meal_time: timeStr,
        description,
        protein: totalProtein,
        calories: totalCalories,
      });
      if (error) throw error;

      toast({ title: "Comida registrada ✅", description });
      setFoods([]);
      setPreview(null);
      onMealSaved?.();
    } catch (err: any) {
      toast({ title: "Error", description: err?.message ?? "Error guardando comida", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }, [foods, userId, toast, onMealSaved]);

  const handleCancel = () => {
    setFoods([]);
    setPreview(null);
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFile}
      />

      {!preview && (
        <Button
          variant="outline"
          className="w-full min-h-[44px] gap-2"
          onClick={() => fileRef.current?.click()}
        >
          <Camera className="h-4 w-4" />
          Analizar foto de comida
        </Button>
      )}

      {preview && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Análisis de foto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <img
              src={preview}
              alt="Comida"
              className="w-full h-40 object-cover rounded-md"
            />

            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analizando imagen...
              </div>
            )}

            {foods.length > 0 && (
              <>
                <div className="space-y-2">
                  {foods.map((f, i) => (
                    <div key={i} className="flex justify-between items-center text-sm border-b border-border pb-1.5">
                      <div>
                        <span className="font-medium">{f.food_name}</span>
                        <span className="text-muted-foreground ml-1">~{f.estimated_grams}g</span>
                      </div>
                      <div className="text-right text-muted-foreground text-xs">
                        {f.estimated_calories} kcal · {f.estimated_protein}g prot
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between text-sm font-medium pt-1 border-t border-border">
                  <span>Total</span>
                  <span>
                    {foods.reduce((s, f) => s + f.estimated_calories, 0)} kcal ·{" "}
                    {foods.reduce((s, f) => s + f.estimated_protein, 0)}g prot
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 min-h-[44px] gap-1"
                    onClick={handleConfirm}
                    disabled={saving}
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    Confirmar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="min-h-[44px] gap-1"
                    onClick={handleCancel}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </>
            )}

            {!analyzing && foods.length === 0 && preview && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 min-h-[44px]"
                  onClick={() => fileRef.current?.click()}
                >
                  Reintentar
                </Button>
                <Button size="sm" variant="ghost" className="min-h-[44px]" onClick={handleCancel}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MealPhotoAnalyzer;
