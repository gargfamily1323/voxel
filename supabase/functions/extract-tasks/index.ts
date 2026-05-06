import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { transcript, language } = await req.json();
    if (!transcript) throw new Error("No transcript provided");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const today = new Date().toISOString().slice(0, 10);
    const outputLanguage = language || "English";
    const systemPrompt = `Today's Date is ${today}.

You extract actionable tasks from a user's voice brain dump. The user may speak in any language.

Rules:
- Categorize each task into exactly one of: TECH, SCHOOL, PERSONAL
- Assign Priority: high, med, or low based on tone and deadlines mentioned
- Format every task title with an action verb
- Language rule for task titles:
  - The user's selected app language is: ${outputLanguage}.
  - If the spoken/input language MATCHES the selected language, write task titles in ${outputLanguage}.
  - If the user speaks in Hindi but the selected language is English, write task titles in Hinglish (Hindi words written in Roman/English script, mixing Hindi and English naturally as spoken in India). Do NOT translate fully to English.
  - Otherwise, if the spoken language differs from the selected language, write task titles in ${outputLanguage}.
- If a relative date is mentioned ("tomorrow", "next Monday", "in 3 days"), calculate the actual calendar date as YYYY-MM-DD
- If no date mentioned, due_date should be null
- Output ONLY via the extract_tasks tool call`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcript },
        ],
        tools: [{
          type: "function",
          function: {
            name: "extract_tasks",
            description: "Return extracted tasks",
            parameters: {
              type: "object",
              properties: {
                tasks: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      title: { type: "string", description: "Action-verb starting task title" },
                      category: { type: "string", enum: ["TECH", "SCHOOL", "PERSONAL"] },
                      priority: { type: "string", enum: ["high", "med", "low"] },
                      due_date: { type: ["string", "null"], description: "YYYY-MM-DD or null" },
                    },
                    required: ["title", "category", "priority", "due_date"],
                    additionalProperties: false,
                  },
                },
              },
              required: ["tasks"],
              additionalProperties: false,
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "extract_tasks" } },
      }),
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("Extract error:", response.status, t);
      if (response.status === 429) return new Response(JSON.stringify({ error: "Rate limit reached. Please try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error(`Extract failed: ${t}`);
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { tasks: [] };
    return new Response(JSON.stringify(args), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("extract-tasks error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
