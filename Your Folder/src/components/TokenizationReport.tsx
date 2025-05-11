/*  src/components/TokenizationReport.tsx  */
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Info, Download } from 'lucide-react';

import PlatformRecommendations from './PlatformRecommendations';
import NextStepsComponent from './next-steps-component';
import ExitStrategiesSection from './exit-strategies/ExitStrategiesSection';
import ExecutiveSummary from './report-sections/ExecutiveSummary';
import FinancialAnalytics from './report-sections/FinancialAnalytics';
import CostBreakdown from './report-sections/CostBreakdown';

import {
  MarketAnalysisSection,
  RiskAnalysisSection,
  JurisdictionalAnalysisSection
} from './enhanced-report-sections';

import { calculateEnhancedMetrics } from './enhanced-analysis';
import { calculateTokenizationSuitabilityScore } from '../utils/ReportGenerator';
import { generateAIEnhancedReport } from '../utils/aiReportGenerator';

/* --- pdf helpers --- */
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

/* ───── temporary placeholders (unchanged) ───── */
const renderExecutiveSummaryText = () => 'Executive summary will appear here.';
const renderFinancialText       = () => 'Financial analytics will appear here.';
const renderRiskText            = () => 'Risk analysis will appear here.';
const renderSuitabilityText     = () => 'Suitability analysis will appear here.';

const localMarketText  = 'Market analysis will appear here.';
const localRegText     = 'Regulatory analysis will appear here.';
const localFinText     = 'Financial analysis will appear here.';
const localAdviceText  = 'Strategic advice will appear here.';

const renderNextStepsText      = () => 'Next steps will appear here.';
const renderExitStrategiesText = () => 'Exit strategies will appear here.';
const renderCostText           = () => 'Cost breakdown will appear here.';
/* ─────────────────────────────────────────────── */

interface TokenizationReportProps {
  responses: any;
}

const TokenizationReport: React.FC<TokenizationReportProps> = ({ responses }) => {
  /* ----- refs ----- */
  const reportRef = useRef<HTMLDivElement>(null);

  /* ----- state ----- */
  const [enhancedMetrics,   setEnhancedMetrics] = useState<any>(null);
  const [benchmarkData,     setBenchmarkData]   = useState<any>(null);
  const [isLoadingAI,       setIsLoadingAI]     = useState(false);
  const [aiSections,        setAiSections]      = useState<Record<string,string>>({});
  const [suitabilityScore,  setSuitability]     = useState<number>(0);

  /* ----- effects ----- */
  useEffect(() => {
    /* local numeric work -------------------------------------- */
    const suitability = calculateTokenizationSuitabilityScore(responses);
    setSuitability(suitability?.score ?? 0);

    const safe = { /* ...fill-defaults as before... */ };
    const metrics = calculateEnhancedMetrics(safe);
    setEnhancedMetrics(metrics);

    setBenchmarkData({ capRate:5.8, operatingExpenseRatio:42, occupancyRate:92,
                       tokenizedCapRate:6.2, tokenizedOperatingExpenseRatio:38, tokenizedOccupancyRate:94 });

    const base = {
      executiveSummary : renderExecutiveSummaryText(),
      financialAnalytics: renderFinancialText(),
      riskAnalysis      : renderRiskText(),
      marketAnalysis    : localMarketText,
      regulatoryAnalysis: localRegText,
      financialAnalysis : localFinText,
      generalAdvice     : localAdviceText,
      nextSteps         : renderNextStepsText(),
      exitStrategies    : renderExitStrategiesText(),
      costBreakdown     : renderCostText()
    };
    setAiSections(base);

    /* Gemini call --------------------------------------------- */
    (async () => {
      try {
        setIsLoadingAI(true);
        const updated = await generateAIEnhancedReport(
          responses, base,
          { enhancedMetrics: metrics, benchmarkData, suitabilityAnalysis: suitability }
        );
        setAiSections(prev => ({ ...prev, ...updated }));
      } finally { setIsLoadingAI(false); }
    })();
  }, [responses]);

  /* ----- pdf download ----- */
  async function handleDownloadPDF() {
    if (!reportRef.current) return;

    /* 1. turn the whole report div into a canvas */
    const canvas = await html2canvas(reportRef.current, {
      scale: 2,     // crisper text
      useCORS: true // honour remote images (logos etc.)
    });

    /* 2. canvas -> image -> jsPDF */
    const imgData = canvas.toDataURL('image/png');
    const pdf     = new jsPDF({
      orientation : 'portrait',
      unit        : 'pt',
      format      : 'a4'
    });

    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    /* keep aspect ratio, fit width */
    const imgProps  = pdf.getImageProperties(imgData);
    const ratio     = imgProps.width / imgProps.height;
    const imgWidth  = pageWidth;
    const imgHeight = pageWidth / ratio;

    pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
    /* add more pages if the content is taller than one page */
    let remaining = imgHeight - pageHeight;
    let positionY = imgHeight;

    while (remaining > 0) {
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, positionY - imgHeight,
                   imgWidth, imgHeight);
      remaining -= pageHeight;
      positionY += pageHeight;
    }

    pdf.save('tokenization-report.pdf');
  }

  /* still loading numeric prep? */
  if (!enhancedMetrics || !benchmarkData) {
    return <p className="text-center py-20">Generating report…</p>;
  }

  /* ----- render ----- */
  return (
    <div ref={reportRef} className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">

        {/* notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">Important Notice</h3>
              <p className="text-sm text-amber-700 mt-1">
                This report is provided for educational and informational purposes only.
                It does not constitute financial, legal, or investment advice.
              </p>
            </div>
          </div>
        </div>

        {/* title row + download button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div className="text-center sm:text-left">
            <h1 className="text-3xl font-bold">Comprehensive Property Tokenization Analysis</h1>
            <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
          </div>

          <button
            onClick={handleDownloadPDF}
            className="mt-4 sm:mt-0 inline-flex items-center bg-primary text-white px-4 py-2 rounded-lg shadow hover:bg-primary/90 transition"
          >
            <Download className="h-4 w-4 mr-2" />
            Download report as PDF
          </button>
        </div>

        {/* --- sections (unchanged logic) ----------------------- */}
        <ExecutiveSummary responses={responses} />
        <FinancialAnalytics responses={responses} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Market Analysis</span>
              <span className="text-xs text-gray-500 flex items-center">
                <Info className="h-3 w-3 mr-1" /> AI-Enhanced
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAI
              ? <p className="text-center py-6 text-gray-600">Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: aiSections.marketAnalysis }} />}
          </CardContent>
        </Card>

        <RiskAnalysisSection metrics={enhancedMetrics} />

        <Card>
          <CardHeader><CardTitle>Jurisdictional & Regulatory Analysis</CardTitle></CardHeader>
          <CardContent>
            {isLoadingAI
              ? <p className="text-center py-6 text-gray-600">Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: aiSections.regulatoryAnalysis }} />}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>General Advice</CardTitle></CardHeader>
          <CardContent>
            {isLoadingAI
              ? <p className="text-center py-6 text-gray-600">Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: aiSections.generalAdvice }} />}
          </CardContent>
        </Card>

        <PlatformRecommendations /* …props… */ />

        <NextStepsComponent metrics={enhancedMetrics} responses={responses} />

        <ExitStrategiesSection
          /* props unchanged */
        />

        <CostBreakdown responses={responses} />
      </div>
    </div>
  );
};

export default TokenizationReport;
