// netlify/functions/enhance-report.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ────────────────────────────────────────── */
/* 1 ◂ Gemini client                          */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ────────────────────────────────────────── */
/* 2 ◂ Prompt builder                         */
function buildPrompt (payload) {
  return `
You are PropNition’s senior analyst.  
Write as if the client has paid **£50** – every sentence must add value.

**Inputs**  
• rawFormData   – questionnaire answers  
• baseSections  – current placeholder text  
• calcMetrics   – numeric KPIs we pre-computed  

---

## TASK 1 – Refresh any section that still contains dummy text
Rewrite it so it flows naturally and matches the data.

## TASK 2 – Create these four expert sections

1. **strategicAnalysis** ≈ 500-600 words  
   • Open with a ~75-word executive-insight paragraph.  
   • Quote **one** current cap-rate % *and* **one** vacancy % for the
     property’s sub-market (cite source).  
   • Concise 3-year trend paragraph.  
   • Finish with a GitHub-flavoured-Markdown table: 3 opportunities /
     3 threats that tie directly to the owner’s objectives.

2. **regulatoryAnalysis** ≈ 300-400 words  
   • Lead regulator & newest guideline (give date).  
   • Four concrete compliance steps the owner must take.  
   • If no sandbox/pilot exists, state “No sandbox exists”.

3. **financialAnalysis** ≈ 300-350 words  
   • Token count, token price, equity %.  
   • 5-year cash-on-cash return **one number** & IRR **one number**
     (mark as “modelled” if projected).  
   • Table: Metric | Pre-Tokenisation | Post-Tokenisation.

4. **generalAdvice** ≈ 400-450 words  
   • Five numbered, high-impact next steps – avoid generic clichés.

---

### Style rules  
• British English, **Markdown**.  
• **Never** output placeholders like “[Source]” or “X–Y %”.  
  If a figure is truly unavailable, write “(no recent figure found)”.  
• Cite every live number, e.g. “6.1 % (Savills 2024)”.  
• Return **one JSON object** containing *all original keys* plus  
  \`strategicAnalysis\`, \`regulatoryAnalysis\`, \`financialAnalysis\`,
  \`generalAdvice\` – nothing else.

INPUT  
${JSON.stringify(payload, null, 2)}
`;
}

/* ────────────────────────────────────────── */
/* 3 ◂ Netlify handler                        */
export async function handler (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const payload = JSON.parse(event.body || "{}");

  try {
    const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-pro" });

    const res = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 4096 }
    });

    /* strip ``` fences if Gemini wraps the json */
    const cleaned = res.response.text()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    return { statusCode: 200, body: cleaned };
  } catch (err) {
    console.error("Gemini error →", err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
}
