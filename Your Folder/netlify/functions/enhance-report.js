// netlify/functions/enhance-report.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ─── 1. Gemini client ─── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ─── 2. Prompt builder ─── */
function buildPrompt(payload) {
  return `
You are PropNition's senior analyst.

Provided:
• rawFormData  – questionnaire answers  
• baseSections – every section our local code already produced  
• calcMetrics  – numeric benchmarks  

TASK 1 – Refresh every existing section  
• Patch wording so facts are up-to-date but keep structure.

TASK 2 – Build four sections from scratch  
1) **marketAnalysis** (≈450–550 words)…  
2) **regulatoryAnalysis** (≈300–400 words)…  
3) **financialAnalysis** (≈350–450 words)…  
4) **aiAdvice** (≈250–350 words)…

Tone & formatting  
• British English; markdown; cite every live figure.  
• If data missing → “(no recent figure found)”.  
• Output **one JSON object** with keys = baseSections + the four above.

Live search  
You have \`web_search\` for facts.

INPUT  
${JSON.stringify(payload, null, 2)}
`;
}

/* ─── 3. Netlify handler ─── */
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const payload = JSON.parse(event.body || "{}");

  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-pro"   // ← exact path that exists on the API
    });

    const response = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 4096 }
    });

    return { statusCode: 200, body: response.response.text() };
  } catch (err) {
    console.error("Gemini error →", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Gemini failed" }) };
  }
}
