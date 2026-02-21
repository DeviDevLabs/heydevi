import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, Activity, History, ChevronRight, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateES } from "@/lib/dateUtils";

type Biomarker = {
  item: string;
  value: number;
  unit: string;
  range: string;
  profile?: string;
  status?: string;
};

type BloodTest = {
  id: string;
  test_date: string;
  test_type: string;
  biomarkers: Biomarker[];
  notes?: string;
};

const Biomarkers = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tests, setTests] = useState<BloodTest[]>([]);
  const [currentResult, setCurrentResult] = useState<Partial<BloodTest> | null>(null);
  const [loading, setLoading] = useState(true);

  const loadTests = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("blood_tests")
        .select("*")
        .order("test_date", { ascending: false });
      
      if (error) throw error;
      setTests(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadTests();
  }, [loadTests]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    setCurrentResult(null);

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      try {
        const { data, error } = await supabase.functions.invoke("analyze-blood-test", {
          body: { file: base64, fileName: file.name },
        });

        if (error) throw error;
        setCurrentResult(data);
        toast({ title: "Análisis completado", description: "Revisa los resultados extraídos" });
      } catch (err: any) {
        toast({ title: "Error de análisis", description: err.message, variant: "destructive" });
      } finally {
        setAnalyzing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user || !currentResult) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("blood_tests").insert({
        user_id: user.id,
        test_date: currentResult.test_date,
        test_type: currentResult.test_type,
        biomarkers: currentResult.biomarkers as any,
      });

      if (error) throw error;
      
      toast({ title: "Guardado", description: "El análisis ha sido registrado en tu historial" });
      setCurrentResult(null);
      loadTests();
    } catch (err: any) {
      toast({ title: "Error al guardar", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isOutOfRange = (biomarker: Biomarker) => {
    // Basic numeric check if range is format "X - Y"
    const rangeMatch = biomarker.range.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
    if (rangeMatch) {
      const min = parseFloat(rangeMatch[1]);
      const max = parseFloat(rangeMatch[2]);
      return biomarker.value < min || biomarker.value > max;
    }
    // Fallback to status if provided
    const status = biomarker.status?.toLowerCase() || "";
    return status.includes("h") || status.includes("l") || status.includes("abnormal") || status.includes("fuera");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-serif">Biomarcadores</h1>
          <p className="text-muted-foreground text-sm mt-1">Analiza y trackea tus analíticas de sangre</p>
        </div>
        <Activity className="text-primary h-8 w-8 opacity-20" />
      </div>

      <Card className="border-dashed border-2">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Subir reporte de laboratorio</p>
              <p className="text-xs text-muted-foreground italic">Soporta PDF o Imágenes (JPEG/PNG)</p>
            </div>
            <div className="w-full max-w-xs">
              <Label htmlFor="blood-test-upload" className="sr-only">Subir archivo</Label>
              <Input 
                id="blood-test-upload" 
                type="file" 
                accept=".pdf,image/*" 
                onChange={handleFileUpload} 
                disabled={analyzing}
                className="cursor-pointer"
              />
            </div>
            {analyzing && (
              <div className="flex items-center gap-2 text-sm text-primary animate-pulse">
                <Loader2 className="h-4 w-4 animate-spin" />
                IA analizando tu reporte...
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentResult && (
        <Card className="border-primary/50 shadow-md animate-in fade-in slide-in-from-bottom-4">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-lg">Análisis Detectado</CardTitle>
                <CardDescription>Fecha: {currentResult.test_date} · Tipo: {currentResult.test_type}</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setCurrentResult(null)}>Descartar</Button>
                <Button size="sm" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Confirmar y Guardar
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[400px] overflow-auto rounded-md border border-border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ítem</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Unidad</TableHead>
                    <TableHead>Rango Ref.</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentResult.biomarkers?.map((b, i) => (
                    <TableRow key={i} className={isOutOfRange(b) ? "bg-destructive/5" : ""}>
                      <TableCell className="font-medium py-2">
                        {b.item}
                        {isOutOfRange(b) && <AlertTriangle className="h-3 w-3 text-destructive inline ml-1" title="Fuera de rango" />}
                      </TableCell>
                      <TableCell className={`text-right font-mono py-2 ${isOutOfRange(b) ? "text-destructive font-bold" : ""}`}>
                        {b.value}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">{b.unit}</TableCell>
                      <TableCell className="text-muted-foreground text-xs py-2">{b.range}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <h2 className="font-semibold flex items-center gap-2">
          <History className="h-4 w-4" />
          Historial de analíticas
        </h2>
        
        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
            <p className="text-sm text-muted-foreground">No tienes análisis registrados todavía.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {tests.map((test) => (
              <Card key={test.id} className="hover:bg-accent/5 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{test.test_type || "Análisis de Sangre"}</p>
                      <p className="text-xs text-muted-foreground">{formatDateES(test.test_date)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                      <p className="text-xs font-medium">{test.biomarkers.length} marcadores</p>
                      <Badge variant="outline" className="text-[10px] h-4">
                        {test.biomarkers.filter(isOutOfRange).length} fuera de rango
                      </Badge>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Biomarkers;
