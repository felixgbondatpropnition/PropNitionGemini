// src/utils/aiReportGenerator.js
export async function generateAIEnhancedReport(formData, baseSections, calcMetrics) {
  const res = await fetch('/.netlify/functions/enhance-report', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rawFormData: formData,
      baseSections,
      calcMetrics
    })
  });

  if (!res.ok) throw new Error('AI enhancement failed');
  return await res.json();          // returns updated text for all sections
}