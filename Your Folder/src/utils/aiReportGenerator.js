/*  src/utils/aiReportGenerator.js
    --------------------------------------------------------------
    Handles the round-trip to Netlify Function `/enhance-report`
    and safely parses whatever Gemini sends back.                */

/* ─── helpers ────────────────────────────────────────────────── */

/** removes ``` fences that Gemini sometimes wraps around JSON */
function stripCodeFence(raw) {
  let txt = raw.trim();

  if (txt.startsWith("```")) {
    // drop first line  (```  or  ```json)
    txt = txt.split("\n").slice(1).join("\n");
    // drop trailing ```
    if (txt.endsWith("```")) txt = txt.slice(0, -3);
    txt = txt.trim();
  }
  return txt;
}

/** JSON.parse that never throws – returns null on failure */
export function safeParse(jsonText) {
  try {
    return JSON.parse(jsonText);
  } catch {
    return null;                        // signal “parse failed”
  }
}

/* ─── main entry ────────────────────────────────────────────── */

/**
 * Sends raw form data + local placeholders to the Netlify Function
 * and returns an object of AI-enhanced sections.
 * If the call fails *or* Gemini emits broken JSON,
 * we return an empty object so the UI keeps its placeholders.
 */
export async function generateAIEnhancedReport(
  rawFormData,
  baseSections,
  calcMetrics
) {
  const body = JSON.stringify({ rawFormData, baseSections, calcMetrics });

  let res;
  try {
    res = await fetch("/.netlify/functions/enhance-report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body
    });
  } catch (netErr) {
    console.error("Network error calling enhance-report:", netErr);
    return {};                            // keep placeholders
  }

  if (!res.ok) {
    console.error("enhance-report failed:", await res.text());
    return {};                            // keep placeholders
  }

  const rawText   = await res.text();     // always plain text
  const cleaned   = stripCodeFence(rawText);
  const aiPayload = safeParse(cleaned);   // <= robust parse

  if (!aiPayload || typeof aiPayload !== "object") {
    console.error("AI JSON parse error – kept placeholders:", cleaned);
    return {};
  }

  return aiPayload;                       // success
}
