/*  src/utils/aiReportGenerator.js
    --------------------------------------------------------------
    Handles the round-trip to Netlify Function `/enhance-report`
    and *robustly* parses whatever Gemini sends back.
*/

/* ─── helpers ────────────────────────────────────────────────── */

/** Remove ``` fences that Gemini sometimes wraps around JSON. */
function stripCodeFence(raw) {
  let txt = raw.trim();

  if (txt.startsWith('```')) {
    // drop the first line  (```  or  ```json …)
    txt = txt.split('\n').slice(1).join('\n');
    // drop trailing ```
    if (txt.endsWith('```')) txt = txt.slice(0, -3);
    txt = txt.trim();
  }
  return txt;
}

/**
 * Gemini often leaves *literal new-lines* inside quoted strings, which
 * breaks JSON.parse.  This walks the text and converts any bare '\n'
 * that occur *inside* a double-quoted string into the escape sequence
 * '\\n', making the payload valid JSON.
 */
function escapeBareNewlines(jsonish) {
  let inString = false;
  let output   = '';

  for (let i = 0; i < jsonish.length; i++) {
    const ch = jsonish[i];

    if (ch === '"' && jsonish[i - 1] !== '\\') {
      inString = !inString;                 // toggle “inside string”
    }

    if (ch === '\n' && inString) {
      output += '\\n';                      // escape it
    } else {
      output += ch;
    }
  }
  return output;
}

/** JSON.parse that never throws – returns null on failure. */
function safeParse(str) {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

/* ─── main entry ────────────────────────────────────────────── */

/**
 * Sends the form data + local placeholders to the Netlify Function
 * and returns an object of AI-enhanced sections.
 * If the call fails *or* Gemini emits broken JSON, we return an empty
 * object so the UI keeps its placeholders.
 */
export async function generateAIEnhancedReport(
  rawFormData,
  baseSections,
  calcMetrics
) {
  const body = JSON.stringify({ rawFormData, baseSections, calcMetrics });

  /* 1 ▸ call the Function ------------------------------------------------ */
  let res;
  try {
    res = await fetch('/.netlify/functions/enhance-report', {
      method : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body
    });
  } catch (netErr) {
    console.error('Network error calling enhance-report:', netErr);
    return {};                              // keep placeholders
  }

  if (!res.ok) {
    console.error('enhance-report failed:', await res.text());
    return {};                              // keep placeholders
  }

  /* 2 ▸ clean & repair Gemini’s text ------------------------------------ */
  const raw      = await res.text();        // always plain text
  const cleaned  = stripCodeFence(raw);
  const repaired = escapeBareNewlines(cleaned);

  /* 3 ▸ final parse ------------------------------------------------------ */
  const aiPayload = safeParse(repaired);

  if (!aiPayload || typeof aiPayload !== 'object') {
    console.error('AI JSON parse error – kept placeholders:', repaired);
    return {};
  }

  return aiPayload;                         // ✅ success
}
