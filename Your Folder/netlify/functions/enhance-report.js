// netlify/functions/enhance-report.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(
  process.env.GEMINI_API_KEY,
  { apiVersion: "v1beta" } // use v1beta so models/gemini-pro is available
);

/* ---- prompt builder ---- */
function buildPrompt(payload) {
  return `
You are PropNition's senior analyst.

Provided:
• rawFormData   – questionnaire answers  
• baseSections  – every section our local code already produced  
• calcMetrics   – numeric benchmarks  

TASK 1 – Refresh every existing section  
• For each key in baseSections, patch or append wording so facts are up-to-date.  
• Never delete useful content or change structure drastically.

TASK 2 – Rebuild four key sections from scratch  
1) **marketAnalysis** (≈450–550 words)  
   • ≥3 tokenization headlines ≤30 days old (with date & source).  
   • Current cap-rate range & vacancy rate (cite source).  
   • 3-year trend + table of 2 opportunities / 2 threats.  

2) **regulatoryAnalysis** (≈300–400 words)  
   • Main regulator + most recent guideline (date).  
   • Compliance steps; sandbox/pilot info.  

3) **financialAnalysis** (≈350–450 words)  
   • Token count, price, equity %.  
   • 5-year cash-on-cash & IRR with assumptions in brief.  
   • Table: Metric | Pre-Tokenization | Post-Tokenization.  

4) **aiAdvice** (≈250–350 words)  
   • One-sentence verdict.  
   • Five numbered, action-oriented recommendations.  
   • 90-day checklist (bullets).

Tone & formatting  
• British English; Markdown headings/bullets/tables.  
• Cite every live figure: "(Source: … 4 May 2025)".  
• If data missing: write "(no recent figure found)".  
• OUTPUT exactly one JSON object whose keys match baseSections plus the four above.

Live search  
You have \`web_search\`; use it for facts.

INPUT
${JSON.stringify(payload, null, 2)}
`;
}

/* ---- Netlify handler ---- */
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const payload = JSON.parse(event.body || "{}");

  try {
    const model = genAI.getGenerativeModel({
      model: "models/gemini-pro" // full path required on v1beta
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 4096 }
    });

    return { statusCode: 200, body: result.response.text() };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: "Gemini failed" }) };
  }
}
