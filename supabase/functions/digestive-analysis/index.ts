import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { logs } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    if (!logs || logs.length < 3) {
      return new Response(
        JSON.stringify({ analysis: "Se necesitan al menos 3 registros digestivos para generar un análisis." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const logsText = logs
      .map(
        (l: any) =>
          `Fecha: ${l.log_date}, Hora: ${l.log_time || "N/A"}, Síntoma: ${l.symptom}, Severidad: ${l.severity}/5, Comida: ${l.associated_meal || "no especificada"}`
      )
      .join("\n");

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            {
              role: "system",
              content: `Eres un asistente de salud digestiva educativo. Analiza los registros de síntomas digestivos del usuario y proporciona:

1. **Patrones detectados**: correlaciones entre comidas y síntomas
2. **Top gatillantes**: comidas o categorías que parecen causar más síntomas
3. **Comidas seguras**: las que menos síntomas generan
4. **Recomendaciones prácticas**: ajustes dietéticos sugeridos (ej. "más recetas suaves por la noche", "reducir legumbres en cena")
5. **Tendencia general**: ¿mejorando o empeorando?

IMPORTANTE:
- Usa español
- Sé conciso y práctico
- Incluye al final: "Esta información es educativa y no reemplaza consejo médico."
- Usa emojis para hacer la información más visual
- Agrupa por secciones claras`,
            },
            {
              role: "user",
              content: `Aquí están mis registros digestivos recientes:\n\n${logsText}`,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Demasiadas solicitudes. Intenta de nuevo en un momento." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos de IA agotados." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("Error en el servicio de IA");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "No se pudo generar el análisis.";

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("digestive-analysis error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
