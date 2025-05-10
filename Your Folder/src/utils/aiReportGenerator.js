/*  src/utils/aiReportGenerator.js  */

function stripCodeFence(raw) {
  // remove leading/trailing back-ticked ```json fences if present
  let txt = raw.trim();
  if (txt.startsWith("```")) {
    // drop the first line (``` or ```json …) and the last ```
    txt = txt.split("\n").slice(1).join("\n");       // remove first line
    if (txt.endsWith("```")) txt = txt.slice(0, -3); // remove trailing ```
    txt = txt.trim();
  }
  return txt;
}

export async function generateAIEnhancedReport(rawFormData, baseSections, calcMetrics) {
  const body = JSON.stringify({ rawFormData, baseSections, calcMetrics });

  const res = await fetch("/.netlify/functions/enhance-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body
  });

  if (!res.ok) {
    console.error("enhance-report failed:", await res.text());
    return {};                      // keep placeholders
  }

  const raw = await res.text();     // the Function always returns text
  const cleaned = stripCodeFence(raw);

  try {
    return JSON.parse(cleaned);     // ← finally parsed to real object
  } catch (err) {
    console.error("AI JSON parse error:", err, cleaned);
    return {};
  }
}
