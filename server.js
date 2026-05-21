import Anthropic from "@anthropic-ai/sdk";
import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

app.post("/clari", async (req, res) => {
  const {
    name,
    income,
    fixedCosts,
    variableCosts,
    savings,
    clariScore,
    runway,
    language,
    question,
    conversationHistory,
  } = req.body;

  const systemPrompt = `Du er Clari — en AI indbygget i Caleio-appen der hjælper ${name || "brugeren"} med at forstå deres økonomi.

BRUGERENS TAL:
- Månedlig indkomst: ${income}
- Faste udgifter: ${fixedCosts}
- Variable udgifter: ${variableCosts}
- Opsparing: ${savings}
- Clari-score: ${clariScore}/100
- Runway: ${runway} måneder

DIN ROLLE:
- Du hjælper brugeren forstå deres tal og deres økonomiske situation
- Du forklarer og tydeliggør — du råder ALDRIG
- Du er varm, ærlig og direkte — aldrig generisk
- Svar altid kortfattet — maks 3-4 sætninger
- Brug altid brugerens faktiske tal i dine svar
- Svar på ${language === "da" ? "dansk" : language === "de" ? "tysk" : language === "fr" ? "fransk" : language === "es" ? "spansk" : "engelsk"}

VIGTIG: Clari forklarer tal — ikke hvad brugeren skal gøre med dem.`;

  try {
    const messages = [
      ...(conversationHistory || []),
      { role: "user", content: question },
    ];

    const response = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages,
    });

    res.json({ answer: response.content[0].text });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Clari kunne ikke svare. Prøv igen." });
  }
});

app.listen(process.env.PORT || 3000, () => console.log("Clari kører"));
