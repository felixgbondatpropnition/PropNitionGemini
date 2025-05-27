// netlify/functions/enhance-report.js
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ────────────────────────────────────────────────────────────── */
/* 1 ◂ Gemini client                                             */
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/* ────────────────────────────────────────────────────────────── */
/* 2 ◂ Prompt builder                                            */
function buildPrompt(payload) {
  return `
You are PropNition’s senior analyst.  
Write as if the client has paid **£50** for a polished expert report:
precise, concise, and **never** containing filler or placeholders.

**Inputs**  
• \`rawFormData\`  – questionnaire answers  
• \`baseSections\` – our current placeholder text  
• \`calcMetrics\`  – numeric KPIs we pre-computed  

---

### TASK 1 – Refresh existing sections  
Rewrite any section in \`baseSections\` that still contains dummy text so
it reads naturally and aligns with the form data & metrics.

### TASK 2 – Re-create these four sections from scratch

1. **marketAnalysis** ≈ 450-550 words  
   • Exactly **3** tokenisation headlines, each ≤ 30 days old – include
     *date & publisher*.  
   • One single cap-rate % and one single vacancy % for the property’s
     sub-market (cite source).  
   • A 3-year-trend paragraph.  
   • A GFM table with **2 opportunities** and **2 threats**.

2. **regulatoryAnalysis** ≈ 300-400 words  
   • Lead regulator + newest relevant guideline (give the date).  
   • Four concrete compliance steps the owner must take.  
   • If *no* sandbox/pilot exists, state “No sandbox exists” explicitly.

3. **financialAnalysis** ≈ 350-450 words  
   • Token count, token price, equity %.  
   • 5-year cash-on-cash return **one number**, IRR **one number**
     (write “modelled” if projected).  
   • GFM table: Metric | Pre-Tokenisation | Post-Tokenisation.

4. **generalAdvice** ≈ 500-600 words  
   • Five numbered, high-impact recommendations tailored to the client’s
     goals & timeline – avoid generic clichés.

---

### Style & hard rules  
• British English, Markdown output.  
• **Never** output placeholders like “[Source Name]” or “X % – Y %”.  
  If you genuinely cannot find a figure, write “(no recent figure found)”.  
• Cite every live figure you do include, e.g. “6.1 % (Brookfield 2024)”.  
• Return **one JSON object** with all original keys plus the four
  rebuilt sections – nothing else.

You can call \`web_search\` for live facts.

INPUT  
${JSON.stringify(payload, null, 2)}
`;
}

/* ────────────────────────────────────────────────────────────── */
/* 3 ◂ Netlify handler                                           */
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const payload = JSON.parse(event.body || "{}");

  try {
    /* 3.1 ◂ model handle */
    const model = genAI.getGenerativeModel({
      model: "models/gemini-1.5-pro"
    });

    /* 3.2 ◂ call Gemini */
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: buildPrompt(payload) }] }],
      generationConfig: { temperature: 0.25, maxOutputTokens: 4096 }
    });

    /* 3.3 ◂ strip ```json fences if they appear */
    const raw     = result.response.text().trim();
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
