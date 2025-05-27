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
Write as if the client has paid **£50** – deliver expert clarity,
zero filler, no placeholders.

**Inputs**  
• \`rawFormData\`  – questionnaire answers  
• \`baseSections\` – current placeholder text  
• \`calcMetrics\`  – numeric KPIs we pre-computed  

---

### TASK 1 – Refresh existing sections  
Replace any dummy text in \`baseSections\` with meaningful prose that
matches the form data & metrics.

### TASK 2 – Build **three** brand-new sections

1. **strategicAnalysis** ≈ 650-800 words (this *replaces* any prior
   “marketAnalysis”).  
   • Start with a 75-word executive insight paragraph.  
   • Exactly **3** fresh (< 30 days) tokenisation headlines – show
     *date + publisher* and 1-sentence relevance each.  
   • Current cap-rate % and vacancy % for the property’s sub-market
     (cite source).  
   • Concise 3-year trend paragraph.  
   • GFM table: **3 opportunities** & **3 threats** tailored to the
     owner’s objectives.

2. **regulatoryAnalysis** ≈ 300-400 words  
   • Lead regulator & newest guideline (give date).  
   • Four concrete compliance steps the owner must take.  
   • If no sandbox/pilot exists → say “No sandbox exists”.

3. **financialAnalysis** ≈ 350-450 words  
   • Token count, token price, equity %.  
   • 5-year cash-on-cash return (single number) & IRR (single number) –
     label “modelled” if projected.  
   • GFM table: Metric | Pre-Tokenisation | Post-Tokenisation.

4. **generalAdvice** ≈ 500-600 words  
   • Five numbered, high-impact recommendations specific to the
     questionnaire answers – avoid generic clichés.

---

### Style rules  
• British English, Markdown.  
• **Never** output placeholders like “[Source]” or “X–Y %”.  
  If a figure truly cannot be found → “(no recent figure found)”.  
• Cite every live number: “6.1 % (Brookfield 2024)”.  
• Return **one JSON object** containing *all original keys*
  **plus** \`strategicAnalysis\`, \`regulatoryAnalysis\`,
  \`financialAnalysis\`, \`generalAdvice\` – nothing else.

You may call \`web_search\` for facts.

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

    /* 3.3 ◂ strip ```json fences if present */
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
