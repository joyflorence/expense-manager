import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "2mb" }));

// Server-side Gemini client initialization
const getAIClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// AI Monthly Productivity & Budget Audit Endpoint
app.post("/api/ai/analyze", async (req, res) => {
  try {
    const { month, tasks, expenses, budget } = req.body;

    if (!month || !tasks || !expenses) {
      return res.status(400).json({ error: "Missing required dataset parameters." });
    }

    const ai = getAIClient();

    const prompt = `
You are an expert Productivity Coach & Business Financial Advisor based in Uganda. Analyze the user's monthly data for month: ${month}. All financial amounts are in UGX (Ugandan Shilling).

UGANDA TAX RULES CONTEXT:
- Mobile Money Cash Withdrawals & Mobile Money Transfers / Sending: 0.5% Uganda Excise Duty.
- Equity Bank Cash Withdrawals & Agent Cash Withdrawals: 0.5% Uganda Excise Duty.
- Commercial Purchases of Goods / Services: 18% Uganda VAT (Value Added Tax).
- Local Services Withholding Tax (WHT): 6%.

MONTHLY BUDGET & GOALS (in UGX):
- Work Budget: UGX ${budget?.workBudget || 100000}
- Personal Budget: UGX ${budget?.personalBudget || 100000}
- Target Productivity Hours: ${budget?.targetProductivityHours || 160} hrs

TASKS SUMMARY (${tasks.length} tasks):
${JSON.stringify(tasks, null, 2)}

EXPENSES & TAXES SUMMARY (${expenses.length} records in UGX):
${JSON.stringify(expenses, null, 2)}

Provide an objective, highly detailed monthly analysis in JSON format covering (referencing UGX for monetary amounts):
1. "productivityScore": 0 to 100 based on task completion rate, hours logged vs target, and balance of work/personal goals.
2. "budgetHealthScore": 0 to 100 based on spending vs budget limits and proportion of tax-deductible work expenses.
3. "summary": A concise 2-sentence executive overview of performance.
4. "productivityInsight": Detailed insight on task execution velocity, pending bottlenecks, work/personal time split.
5. "budgetInsight": Detailed evaluation of expenditure across categories, work vs personal spending ratio, and tax burden incurred in UGX.
6. "taxOptimizationTip": Actionable tax deduction strategies for work expenses logged, tax amounts, and potential missing deductions under regional tax rules (e.g., 18% VAT & business write-offs).
7. "recommendedActions": An array of 4 bullet points with specific, high-impact action steps for the next month.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        systemInstruction: "You are a professional financial & productivity analyst. Always output valid structured JSON.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            productivityScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
            budgetHealthScore: { type: Type.NUMBER, description: "Score from 0 to 100" },
            summary: { type: Type.STRING },
            productivityInsight: { type: Type.STRING },
            budgetInsight: { type: Type.STRING },
            taxOptimizationTip: { type: Type.STRING },
            recommendedActions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            "productivityScore",
            "budgetHealthScore",
            "summary",
            "productivityInsight",
            "budgetInsight",
            "taxOptimizationTip",
            "recommendedActions",
          ],
        },
      },
    });

    const resultText = response.text || "{}";
    const reportData = JSON.parse(resultText);

    return res.json({
      success: true,
      month,
      generatedAt: new Date().toISOString(),
      report: reportData,
    });
  } catch (error: any) {
    console.error("Error in /api/ai/analyze:", error);
    return res.status(500).json({
      error: "Failed to generate AI analysis report.",
      details: error.message || String(error),
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[OmniTrack Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
