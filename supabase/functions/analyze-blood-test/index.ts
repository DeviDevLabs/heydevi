const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { file, fileName } = await req.json();
    if (!file || typeof file !== "string") {
      return new Response(JSON.stringify({ error: "Se requiere un archivo en base64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip data URL prefix if present
    const base64Data = file.includes(",") ? file.split(",")[1] : file;
    const mimeMatch = file.match(/^data:([^;]+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : (fileName?.endsWith(".pdf") ? "application/pdf" : "image/jpeg");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content:
              "Eres un experto en laboratorio clínico. Analiza los resultados de sangre proporcionados y utiliza la herramienta para devolver una lista estructurada de biomarcadores. Extrae la fecha del reporte, los nombres de los ítems, valores numéricos, unidades, rangos de referencia y estados.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url", // AI Gateway handles PDF via image_url if model supports it
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
              {
                type: "text",
                text: "Extrae todos los biomarcadores de este reporte de laboratorio.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_biomarkers",
              description: "Report extracted biomarkers from laboratory results",
              parameters: {
                type: "object",
                properties: {
                  test_date: { type: "string", description: "Fecha del análisis (YYYY-MM-DD)" },
                  test_type: { type: "string", description: "Tipo general de análisis (ej. Bioquímica, Hemograma)" },
                  biomarkers: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        item: { type: "string", description: "Nombre del analito (ej. Vitamina B12)" },
                        value: { type: "number", description: "Valor numérico obtenido" },
                        unit: { type: "string", description: "Unidades (ej. ng/mL)" },
                        range: { type: "string", description: "Rango de referencia (ej. 156-672)" },
                        profile: { type: "string", description: "Perfil del resultado (ej. Renal Profile)" },
                        status: { type: "string", description: "Estado (ej. Final, LH, Abnormal)" },
                      },
                      required: ["item", "value", "unit", "range"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["test_date", "biomarkers"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_biomarkers" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);
      return new Response(JSON.stringify({ error: "Error al analizar el reporte de laboratorio" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify(parsed), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "No se pudieron extraer biomarcadores del reporte." }), {
      status: 422,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-blood-test error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
