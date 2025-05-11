// netlify/functions/enhance-report.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ─── 1 ◂ Gemini client ─── */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ─── 2 ◂ Prompt builder ─── */
function buildPrompt(payload) {
  return `
You are PropNition's senior analyst.

Provided:
• rawFormData  – questionnaire answers  
• baseSections – every section our local code already produced  
• calcMetrics  – numeric benchmarks  

TASK 1 – Refresh every existing section  
• Patch wording so facts are up-to-date but keep structure.

TASK 2 – Rebuild four key sections from scratch  
1) **marketAnalysis** (≈450–550 words)  
   • ≥ 3 tokenization headlines ≤ 30 days old (with date & source).  
   • Current cap-rate range & vacancy rate (cite source).  
   • 3-year trend + table of 2 opportunities / 2 threats.  

2) **regulatoryAnalysis** (≈300–400 words)  
   • Main regulator + most recent guideline (date).  
   • Concrete compliance steps; sandbox/pilot if any.  

3) **financialAnalysis** (≈350–450 words)  
   • Token count, price, equity %.  
   • 5-year cash-on-cash & IRR; list key assumptions.  
   • Table: Metric | Pre-Tokenization | Post-Tokenization.  

4) **generalAdvice** (≈300–400 words)  
   • Clear, plain-English guidance for the owner about next steps.  
   • 3–5 numbered recommendations covering strategy, timing,  
     investor relations, and risk management.

Tone & formatting  
• British English; Markdown; cite every live figure.  
• If data missing → “(no recent figure found)”.  
• Output **one JSON object** whose keys = baseSections + the four above.

Live search  
You have \`web_search\` for facts.

INPUT  
${JSON.stringify(payload, null, 2)}
`;
}

/* ─── 3 ◂ Netlify handler ─── */
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const payload = JSON.parse(event.body || "{}");

  try {
    const model = genAI.getGenerativeModel({
      // full path that exists on the “v1” endpoint
      model: "models/gemini-1.5-pro"
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 4096 }
    });

    /* ── 4 ▸ strip ```json fences (Gemini sometimes wraps the result) ── */
    const raw = result.response.text().trim();
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, "") // opening fence
      .replace(/```$/i, "")             // closing fence
      .trim();

    return { statusCode: 200, body: cleaned };
  } catch (err) {
    console.error("Gemini error →", err);
    return { statusCode: 500, body: JSON.stringify({ error: "Gemini failed" }) };
  }
}
