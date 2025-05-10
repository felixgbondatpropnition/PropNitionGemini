/*  src/utils/aiReportGenerator.js  */
export async function generateAIEnhancedReport(
  rawFormData,
  baseSections,
  calcMetrics
) {
  // 1 ▸ build the payload Netlify expects
  const body = JSON.stringify({
    rawFormData,
    baseSections,
    calcMetrics,
  });

  // 2 ▸ POST to the Function
  const res = await fetch("/.netlify/functions/enhance-report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  if (!res.ok) {
    // surface the problem in DevTools but keep the UI alive
    console.error("enhance-report failed", await res.text());
    return {}; // leaves placeholders in place
  }

  // 3 ▸ always parse – the Function returns a JSON string
  const text = await res.text();

  try {
    const json = JSON.parse(text); // ← critical: convert to real object
    return json;                   // { marketAnalysis: "...", ... }
  } catch (err) {
    console.error("Could not parse AI JSON:", err, text);
    return {};
  }
}
