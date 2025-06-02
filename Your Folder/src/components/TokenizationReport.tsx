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

import { Markdown }                  from './Markdown';

import html2canvas                   from 'html2canvas';
import jsPDF                         from 'jspdf';

/* ------------------------------------------------------------------ */
/* placeholders                                                        */
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
interface TokenizationReportProps { responses: any; }

const TokenizationReport: FC<TokenizationReportProps> = ({ responses }): ReactElement => {
  const reportRef = useRef<HTMLDivElement>(null);

  const [enhancedMetrics, setEnhancedMetrics] = useState<any>(null);
  const [aiSections,      setAiSections]      = useState<Record<string,string>>(placeholder);
  const [isLoading,       setIsLoading]       = useState(false);
  const [autoDone,        setAutoDone]        = useState(false);   /* ← auto-PDF */

  /* ── Paginated PDF generation function ----------------------------- */
  const generatePaginatedPDF = async () => {
    if (!reportRef.current) return;

    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageHeight = pdf.internal.pageSize.getHeight();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 10;
    const contentWidth = pageWidth - (2 * margin);
    const contentHeight = pageHeight - (2 * margin);

    // Clone the report element to avoid modifying the original
    const clonedReport = reportRef.current.cloneNode(true) as HTMLElement;
    clonedReport.style.position = 'absolute';
    clonedReport.style.left = '-9999px';
    clonedReport.style.width = `${contentWidth * 3.7795275591}px`; // Convert mm to px (96 DPI)
    document.body.appendChild(clonedReport);

    try {
      // Generate canvas with higher quality
      const canvas = await html2canvas(clonedReport, {
        scale: 2,
        useCORS: true,
        logging: false,
        windowWidth: contentWidth * 3.7795275591,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const imgHeight = (canvas.height * contentWidth) / canvas.width;
      
      let yPosition = 0;
      let pageNumber = 0;

      while (yPosition < imgHeight) {
        if (pageNumber > 0) {
          pdf.addPage();
        }

        // Calculate the source rectangle for this page
        const sourceY = (yPosition * canvas.width) / contentWidth;
        const sourceHeight = Math.min(
          (contentHeight * canvas.width) / contentWidth,
          canvas.height - sourceY
        );

        // Create a temporary canvas for this page slice
        const pageCanvas = document.createElement('canvas');
        pageCanvas.width = canvas.width;
        pageCanvas.height = sourceHeight;
        const ctx = pageCanvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(
            canvas,
            0, sourceY, canvas.width, sourceHeight,
            0, 0, canvas.width, sourceHeight
          );

          const pageImgData = pageCanvas.toDataURL('image/png');
          const pageImgHeight = (sourceHeight * contentWidth) / canvas.width;
          
          pdf.addImage(
            pageImgData,
            'PNG',
            margin,
            margin,
            contentWidth,
            pageImgHeight
          );
        }

        yPosition += contentHeight;
        pageNumber++;
      }

      // Save the PDF
      pdf.save('tokenization-report.pdf');

    } finally {
      // Clean up the cloned element
      document.body.removeChild(clonedReport);
    }
  };

  /* ── 1 ▸ local calcs + Gemini call --------------------------------- */
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

  /* ── 2 ▸ manual PDF button handler --------------------------------- */
  useEffect(() => {
    async function handleDownload() {
      await generatePaginatedPDF();
    }

    window.addEventListener('download-pdf', handleDownload);
    return () => window.removeEventListener('download-pdf', handleDownload);
  }, []);

  /* ── 3 ▸ AUTO-PDF after AI ready ----------------------------------- */
  useEffect(() => {
    if (isLoading || autoDone) return;          // wait until finished once
    (async () => {
      await generatePaginatedPDF();
      setAutoDone(true);
    })();
  }, [isLoading, autoDone]);

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

        {/* manual download button */}
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

        {/* Strategic Analysis (AI) */}
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

        {/* Disclaimer */}
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

        {/* General Advice (AI) */}
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
