import { NextRequest, NextResponse } from "next/server";

export const runtime = "edge";

interface SceneInfo {
  label: string;
  dimensions?: string;
  rentPrice?: number;
  items: { label: string; price: number; qty: number }[];
}

interface RecommendRequest {
  projectName: string;
  eventType: string;
  budget: number;
  scenes: SceneInfo[];
  userMessage: string;
  history: { role: "user" | "assistant"; content: string }[];
}

function buildSystemPrompt(
  projectName: string,
  eventType: string,
  budget: number,
  scenes: SceneInfo[]
): string {
  const sceneSummary = scenes
    .map((s) => {
      const dims = s.dimensions ?? "unknown size";
      const [w, h] = dims.replace(/m/g, "").split("x").map((v) => parseFloat(v.trim()) || 0);
      const area = w && h ? `${(w * h).toFixed(0)} m²` : "unknown area";
      const itemList =
        s.items.length > 0
          ? s.items.map((it) => `${it.qty}x ${it.label} (€${it.price}/unit)`).join(", ")
          : "no items placed yet";
      const rentLine = s.rentPrice ? `Venue rental: €${s.rentPrice}` : "";
      return `  - "${s.label}": ${dims} (${area})${rentLine ? ", " + rentLine : ""}. Placed items: ${itemList}.`;
    })
    .join("\n");

  const currentSpend = scenes.reduce((total, s) => {
    const itemCost = s.items.reduce((sum, it) => sum + it.price * it.qty, 0);
    const rent = s.rentPrice ?? 0;
    return total + itemCost + rent;
  }, 0);

  return `You are an expert event scenography AI assistant embedded in EventVista, a premium B2B SaaS platform for event agencies.

PROJECT CONTEXT:
- Project: "${projectName}"
- Event type: ${eventType}
- Client budget: €${budget.toLocaleString()}
- Current estimated spend: €${currentSpend.toLocaleString()}
- Budget remaining: €${(budget - currentSpend).toLocaleString()}

SCENES:
${sceneSummary}

YOUR ROLE:
You help event planners optimise their asset allocation across all scenes. For each user question:
1. Analyse the space dimensions to calculate capacity (use standard industry densities: cocktail 1 m²/person, seated dinner 1.5–2 m²/person, conference 1.8 m²/person, wedding reception 2 m²/person).
2. Recommend specific quantities of furniture/assets (chairs, tables, lighting, decor) per scene with clear reasoning tied to the space size and event type.
3. Provide unit prices from the catalogue when relevant: Chair €75, Sofa €450, Table €220, Floor Lamp €120, Plant €45, Coffee Table €180, Bookshelf €250, Flower Vase €35, Dining Table €550.
4. Always produce a clear BUDGET COMPARISON:
   - Initial budget: €X
   - Current spend: €Y
   - Your recommended additions: €Z
   - Total projected cost: €(Y+Z)
   - Budget status: over/under by €...
5. Be concise, structured (use bullet points and short paragraphs), and always explain WHY you suggest each item.
6. If the budget is tight, suggest priorities and trade-offs.
7. Speak professionally but warmly, as if briefing a senior event agency planner.

RESPONSE FORMAT (MANDATORY):
You MUST respond with a valid JSON object — nothing else, no markdown fences, no extra text — with exactly these two keys:
{
  "reply": "<your full answer as a plain string with \\n for line breaks>",
  "suggestions": ["<follow-up question 1>", "<follow-up question 2>", "<follow-up question 3>"]
}
The "suggestions" array must always contain exactly 3 short, relevant follow-up questions the planner might want to ask next, based on the current conversation context. Keep each suggestion under 60 characters.`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  let body: RecommendRequest;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { projectName, eventType, budget, scenes, userMessage, history } = body;

  const systemPrompt = buildSystemPrompt(projectName, eventType, budget, scenes);

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10), // keep last 10 turns for context
    { role: "user", content: userMessage },
  ];

  const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages,
        temperature: 0.6,
        max_tokens: 1200,
        stream: false,
        response_format: { type: "json_object" },
      }),
    });

    if (!groqResponse.ok) {
      const err = await groqResponse.text();
      return NextResponse.json({ error: err }, { status: groqResponse.status });
    }

    const data = await groqResponse.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";

    let reply = "";
    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      reply = parsed.reply ?? raw;
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
    } catch {
      reply = raw;
    }

    return NextResponse.json({ reply, suggestions });
}
