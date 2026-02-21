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

    const { image } = await req.json();
    if (!image || typeof image !== "string") {
      return new Response(JSON.stringify({ error: "Se requiere una imagen en base64" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Strip data URL prefix if present
    const base64Data = image.includes(",") ? image.split(",")[1] : image;
    const mimeMatch = image.match(/^data:(image\/\w+);/);
    const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";

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
              "Eres un nutricionista experto. Analiza la foto de comida y usa la herramienta para devolver los alimentos identificados con estimaciones de porciones, calorías y proteína. Incluye comida latina/española si aplica. Sé preciso con las porciones en gramos.",
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${mimeType};base64,${base64Data}` },
              },
              {
                type: "text",
                text: "Identifica todos los alimentos en esta foto con sus porciones estimadas en gramos, calorías y proteína.",
              },
            ],
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "report_foods",
              description: "Report identified foods with nutritional estimates",
              parameters: {
                type: "object",
                properties: {
                  foods: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        food_name: { type: "string", description: "Nombre del alimento en español" },
                        estimated_grams: { type: "number", description: "Porción estimada en gramos" },
                        estimated_calories: { type: "number", description: "Calorías estimadas" },
                        estimated_protein: { type: "number", description: "Proteína estimada en gramos" },
                      },
                      required: ["food_name", "estimated_grams", "estimated_calories", "estimated_protein"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["foods"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "report_foods" } },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const text = await response.text();
      console.error("AI gateway error:", status, text);

      if (status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas solicitudes, intenta en unos segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de AI agotados. Contacta al administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Error al analizar la imagen" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (toolCall?.function?.arguments) {
      const parsed = JSON.parse(toolCall.function.arguments);
      return new Response(JSON.stringify({ foods: parsed.foods ?? [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fallback: no tool call returned
    return new Response(JSON.stringify({ foods: [], message: "No se pudieron identificar alimentos." }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-meal-photo error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
