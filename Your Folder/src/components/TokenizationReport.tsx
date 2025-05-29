/*  src/components/TokenizationReport.tsx  */
import React, {
  useState,
  useEffect,
  useRef,
  type FC,
  type ReactElement,
} from 'react';
import { AlertTriangle, Info, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

import { RiskAnalysisSection }      from './enhanced-report-sections';
import PlatformRecommendations       from './PlatformRecommendations';
import NextStepsComponent            from './next-steps-component';
import ExitStrategiesSection         from './exit-strategies/ExitStrategiesSection';
import ExecutiveSummary              from './report-sections/ExecutiveSummary';
import FinancialAnalytics            from './report-sections/FinancialAnalytics';
import CostBreakdown                 from './report-sections/CostBreakdown';

import { calculateEnhancedMetrics }  from './enhanced-analysis';
import { generateAIEnhancedReport }  from '../utils/aiReportGenerator';

/* Markdown renderer */
import { Markdown }                  from './Markdown';

/* PDF helpers */
import html2canvas                   from 'html2canvas';
import jsPDF                         from 'jspdf';

/* ------------------------------------------------------------------ */
/* placeholders                                                       */
const placeholder = {
  executiveSummary   : 'Executive summary will appear here.',
  financialAnalytics : 'Financial analytics will appear here.',
  riskAnalysis       : 'Risk analysis will appear here.',
  strategicAnalysis  : 'Strategic analysis will appear here.',
  regulatoryAnalysis : 'Regulatory analysis will appear here.',
  financialAnalysis  : 'Financial analysis will appear here.',
  generalAdvice      : 'General advice will appear here.',
  nextSteps          : 'Next steps will appear here.',
  exitStrategies     : 'Exit strategies will appear here.',
  costBreakdown      : 'Cost breakdown will appear here.',
};

/* ------------------------------------------------------------------ */
/* component                                                          */
interface TokenizationReportProps { responses: any; }

const TokenizationReport: FC<TokenizationReportProps> = ({ responses }): ReactElement => {
  const reportRef = useRef<HTMLDivElement>(null);

  const [enhancedMetrics, setEnhancedMetrics] = useState<any>(null);
  const [aiSections,      setAiSections]      = useState<Record<string,string>>(placeholder);
  const [isLoading,       setIsLoading]       = useState(false);

  /* ── 1. local calcs + Gemini call ---------------------------------- */
  useEffect(() => {
    const safe = {
      ...responses,
      propertyBasics: {
        ...responses.propertyBasics,
        valuation : {
          ...responses.propertyBasics?.valuation,
          currentValue: responses.propertyBasics?.valuation?.currentValue ?? 1_000_000,
        },
        propertyType: responses.propertyBasics?.propertyType ?? 'Commercial',
        location: {
          ...responses.propertyBasics?.location,
          jurisdiction: responses.propertyBasics?.location?.jurisdiction ?? 'United Kingdom',
        },
      },
      tokenizationGoals: {
        ...responses.tokenizationGoals,
        tokenizationPercentage: responses.tokenizationGoals?.tokenizationPercentage ?? 30,
      },
    };

    setEnhancedMetrics(calculateEnhancedMetrics(safe));

    (async () => {
      try {
        setIsLoading(true);
        const updated = await generateAIEnhancedReport(responses, placeholder, {});
        setAiSections({ ...placeholder, ...updated });
      } finally {
        setIsLoading(false);
      }
    })();
  }, [responses]);

  /* ── 2. PDF download listener -------------------------------------- */
  useEffect(() => {
    async function handleDownload() {
      if (!reportRef.current) return;
      const canvas = await html2canvas(reportRef.current, { scale: 2 });
      const img    = canvas.toDataURL('image/png');

      const pdf   = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const ratio = canvas.width / canvas.height;
      const imgW  = pageW;
      const imgH  = pageW / ratio;

      let y = 0;
      pdf.addImage(img, 'PNG', 0, y, imgW, imgH);
      y -= pageH;
      while (Math.abs(y) < imgH) {
        pdf.addPage();
        pdf.addImage(img, 'PNG', 0, y, imgW, imgH);
        y -= pageH;
      }
      pdf.save('tokenization-report.pdf');
    }

    window.addEventListener('download-pdf', handleDownload);
    return () => window.removeEventListener('download-pdf', handleDownload);
  }, []);

  /* ── loading guard -------------------------------------------------- */
  if (!enhancedMetrics) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Generating report…</p>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────────── */
  return (
    <div ref={reportRef} className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">

        {/* download button */}
        <div className="flex justify-end pt-6">
          <button
            onClick={() => window.dispatchEvent(new Event('download-pdf'))}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg
                       hover:bg-primary/90 transition-colors shadow"
          >
            <Download size={16} /> Download report as PDF
          </button>
        </div>

        {/* Important notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-700">
              This report is provided for educational purposes only and does not constitute professional advice.
            </p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center">
          <h1 className="text-3xl font-bold">Comprehensive Property Tokenization Analysis</h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Local core sections */}
        <ExecutiveSummary   responses={responses} />
        <FinancialAnalytics responses={responses} />

        {/* ── NEW: Strategic Analysis (AI) ── */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Strategic Analysis</span>
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <Info size={12} /> AI-Enhanced
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading
              ? <p className="text-center text-gray-500">Loading…</p>
              : <Markdown>{aiSections.strategicAnalysis}</Markdown>}
          </CardContent>
        </Card>

        {/* Risk (local) */}
        <RiskAnalysisSection metrics={enhancedMetrics} />

        {/* Regulatory (AI) */}
        <Card>
          <CardHeader><CardTitle>Jurisdictional & Regulatory Analysis</CardTitle></CardHeader>
          <CardContent>
            {isLoading
              ? <p className="text-center text-gray-500">Loading…</p>
              : <Markdown>{aiSections.regulatoryAnalysis}</Markdown>}
          </CardContent>
        </Card>

        {/* Platform recommendations */}
        <PlatformRecommendations
          propertyDetails={{
            type                : responses.propertyBasics?.propertyType ?? 'Commercial',
            value               : responses.propertyBasics?.valuation?.currentValue ?? 1_000_000,
            location            : responses.propertyBasics?.location?.jurisdiction ?? 'United Kingdom',
            targetInvestorType  : responses.investorProfile?.targetInvestors?.type ?? 'Institutional',
            minInvestmentTarget : responses.investorProfile?.targetInvestors?.minimumInvestment ?? 10_000,
          }}
        />

        {/* ── disclaimer (static) ── */}
        <div className="mt-4 rounded-md bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
          <strong>Note:</strong> Each recommended platform follows its own onboarding
          workflow, fee schedule and compliance checks. Contact the platforms directly to
          confirm how much of the technical tokenisation process they will handle on your behalf.
        </div>

        <NextStepsComponent metrics={enhancedMetrics} responses={responses} />

        <ExitStrategiesSection
          propertyType           = {responses.propertyBasics?.propertyType              ?? 'Commercial'}
          propertyValue          = {responses.propertyBasics?.valuation?.currentValue   ?? 1_000_000}
          tokenizationPercentage = {responses.tokenizationGoals?.tokenizationPercentage ?? 30}
          location               = {responses.propertyBasics?.location?.jurisdiction    ?? 'United Kingdom'}
        />

        <CostBreakdown responses={responses} />

        {/* General advice (AI) */}
        <Card>
          <CardHeader><CardTitle>General Advice</CardTitle></CardHeader>
          <CardContent>
            {isLoading
              ? <p className="text-center text-gray-500">Loading…</p>
              : <Markdown>{aiSections.generalAdvice}</Markdown>}
          </CardContent>
        </Card>

      </div>
    </div>
  );
};

export default TokenizationReport;
