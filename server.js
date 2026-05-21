const express = require("express");
const cors = require("cors");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const LANGUAGE_NAMES = {
  en: "English",
  da: "Danish",
  de: "German",
  fr: "French",
  es: "Spanish",
  ar: "Arabic",
  pt: "Portuguese",
  nl: "Dutch",
  it: "Italian",
  sv: "Swedish",
  nb: "Norwegian",
};

function buildSystemPrompt(language, profile) {
  const langName = LANGUAGE_NAMES[language] || "English";
  const name = profile.name?.trim() || "the user";
  return `You are Clari, the personal financial clarity assistant inside the Caleio app. You help ${name} understand their own numbers in ${langName}. You are warm, direct, and practical — not a generic chatbot.

Rules:
- Use ONLY the financial data provided in the user message context.
- Explain what numbers mean in plain language; compare parts of their budget when helpful.
- Give 2–4 concrete, actionable ideas when relevant — never vague platitudes.
- You are NOT a licensed financial advisor. Do not recommend specific investments, stocks, or crypto. Briefly note when needed: this is education about their numbers, not financial advice.
- Keep answers concise (roughly 120–220 words) unless they ask for detail.
- Never invent numbers not in the context. If data is missing, say what you would need.`;
}

function formatProfileContext(body) {
  const income = Number(body.income) || 0;
  const fixed = Number(body.fixedCosts) || 0;
  const variable = Number(body.variableCosts) || 0;
  const savings = Number(body.savings) || 0;
  const totalOut = fixed + variable;
  const leftover = income - totalOut - savings;
  const clariScore = Number(body.clariScore) || 0;
  const runway = Number(body.runway) || 0;

  return `Current monthly picture:
- Monthly income: ${income}
- Fixed costs: ${fixed}
- Variable costs: ${variable}
- Monthly savings: ${savings}
- Monthly leftover (income − costs − savings): ${leftover}
- Clari score (0–100): ${clariScore}
- Runway (months): ${runway.toFixed(1)}`;
}

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.post("/clari", async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY not configured" });
    }

    const {
      language = "en",
      question,
      conversationHistory = [],
    } = req.body;

    if (!question || typeof question !== "string" || !question.trim()) {
      return res.status(400).json({ error: "question is required" });
    }

    const profile = {
      name: req.body.name,
      income: req.body.income,
      fixedCosts: req.body.fixedCosts,
      variableCosts: req.body.variableCosts,
      savings: req.body.savings,
      clariScore: req.body.clariScore,
      runway: req.body.runway,
    };

    const context = formatProfileContext(req.body);
    const system = buildSystemPrompt(language, profile);

    const messages = [{ role: "system", content: system }];

    const history = Array.isArray(conversationHistory)
      ? conversationHistory.slice(-6)
      : [];
    for (const msg of history) {
      if (msg?.role && msg?.content) {
        const role = msg.role === "assistant" ? "assistant" : "user";
        messages.push({ role, content: String(msg.content) });
      }
    }

    messages.push({
      role: "user",
      content: `${context}\n\nUser question: ${question.trim()}`,
    });

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const answer = completion.choices[0]?.message?.content?.trim();
    if (!answer) {
      return res.status(500).json({ error: "Empty response from model" });
    }

    res.json({ answer });
  } catch (err) {
    console.error("Clari error:", err);
    res.status(500).json({ error: "Clari kunne ikke svare lige nu." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Caleio Clari backend listening on port ${PORT}`);
});
