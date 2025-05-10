/*  src/components/TokenizationReport.tsx  */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { AlertTriangle, Info } from 'lucide-react';

import {
  MarketAnalysisSection,
  RiskAnalysisSection,
  JurisdictionalAnalysisSection
} from './enhanced-report-sections';

import PlatformRecommendations from './PlatformRecommendations';
import BenchmarkPanel from './benchmark-panel';
import NextStepsComponent from './next-steps-component';
import ExitStrategiesSection from './exit-strategies/ExitStrategiesSection';
import ExecutiveSummary from './report-sections/ExecutiveSummary';
import FinancialAnalytics from './report-sections/FinancialAnalytics';
import CostBreakdown from './report-sections/CostBreakdown';

import { calculateEnhancedMetrics } from './enhanced-analysis';
import { calculateTokenizationSuitabilityScore } from '../utils/ReportGenerator';
import { generateAIEnhancedReport } from '../utils/aiReportGenerator';

/* ───── temporary placeholders ───── */
const renderExecutiveSummaryText = () => 'Executive summary will appear here.';
const renderFinancialText       = () => 'Financial analytics will appear here.';
const renderRiskText            = () => 'Risk analysis will appear here.';
const renderSuitabilityText     = () => 'Suitability analysis will appear here.';

const localMarketText           = 'Market analysis will appear here.';
const localRegText              = 'Regulatory analysis will appear here.';
const localFinText              = 'Financial analysis will appear here.';
const localAdviceText           = 'Strategic advice will appear here.';

const renderNextStepsText       = () => 'Next steps will appear here.';
const renderExitStrategiesText  = () => 'Exit strategies will appear here.';
const renderCostText            = () => 'Cost breakdown will appear here.';
/* ─────────────────────────────────── */

interface TokenizationReportProps {
  responses: any;
  additionalInfo?: string;
}

const TokenizationReport: React.FC<TokenizationReportProps> = ({ responses }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'10yr' | '20yr'>('20yr');
  const [enhancedMetrics, setEnhancedMetrics]   = useState<any>(null);
  const [benchmarkData, setBenchmarkData]       = useState<any>(null);
  const [suitabilityAnalysis, setSuitability]   = useState<any>(null);

  const [aiSections, setAiSections]             = useState<Record<string, string> | null>(null);
  const [isLoadingAI, setIsLoadingAI]           = useState(false);

  /* ────────────────────────────────────────────────────────── */
  useEffect(() => {
    /* --- 1. local calculations -------------------------------- */
    const suitability = calculateTokenizationSuitabilityScore(responses);
    setSuitability(suitability);

    /* fill in missing numbers so calculations never explode */
    const safe = {
      ...responses,
      propertyBasics: {
        ...responses.propertyBasics,
        valuation : {
          ...responses.propertyBasics?.valuation,
          currentValue: responses.propertyBasics?.valuation?.currentValue || 1_000_000
        },
        propertyType: responses.propertyBasics?.propertyType || 'Commercial office',
        location: {
          ...responses.propertyBasics?.location,
          jurisdiction: responses.propertyBasics?.location?.jurisdiction || 'United Kingdom'
        }
      },
      tokenizationGoals: {
        ...responses.tokenizationGoals,
        tokenizationPercentage: responses.tokenizationGoals?.tokenizationPercentage || 30
      }
    };

    const metrics = calculateEnhancedMetrics(safe);
    setEnhancedMetrics(metrics);

    /* --- 2. benchmarks (static example) ----------------------- */
    setBenchmarkData({
      capRate: 5.8,
      operatingExpenseRatio: 42,
      occupancyRate: 92,
      tokenizedCapRate: 6.2,
      tokenizedOperatingExpenseRatio: 38,
      tokenizedOccupancyRate: 94
    });

    /* --- 3. initial placeholders shown immediately ----------- */
    const baseSections = {
      executiveSummary : renderExecutiveSummaryText(),
      financialAnalytics: renderFinancialText(),
      riskAnalysis      : renderRiskText(),
      marketAnalysis    : localMarketText,
      regulatoryAnalysis: localRegText,
      financialAnalysis : localFinText,
      aiAdvice          : localAdviceText,
      nextSteps         : renderNextStepsText(),
      exitStrategies    : renderExitStrategiesText(),
      costBreakdown     : renderCostText(),
      suitability       : renderSuitabilityText()
    };
    setAiSections(baseSections);

    /* --- 4. call Gemini -------------------------------------- */
    async function runAI() {
      try {
        setIsLoadingAI(true);

        const updated = await generateAIEnhancedReport(
          responses,
          baseSections,
          { enhancedMetrics: metrics, benchmarkData, suitabilityAnalysis: suitability }
        );

        /* ❶ merge AI sections with what we already have */
        setAiSections(prev => ({ ...(prev || {}), ...updated }));
      } catch {
        /* silent in development */
      } finally {
        setIsLoadingAI(false);
      }
    }
    runAI();
  }, [responses]);
  /* ────────────────────────────────────────────────────────── */

  if (!enhancedMetrics || !benchmarkData || !suitabilityAnalysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Analyzing Data</h2>
          <p className="text-gray-600">Please wait while we generate your comprehensive report…</p>
        </div>
      </div>
    );
  }

  /* -------------------- RENDER ------------------------------- */
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">

        {/* Important Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800">Important Notice</h3>
              <p className="text-sm text-amber-700 mt-1">
                This report is provided for educational and informational purposes only.
                It does not constitute financial, legal, or investment advice.
              </p>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">
            Comprehensive Property Tokenization Analysis
          </h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Executive Summary */}
        <ExecutiveSummary responses={responses} />

        {/* Financial Analytics */}
        <FinancialAnalytics responses={responses} />

        {/* AI-enhanced Market Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Market Analysis</span>
              <span className="text-xs text-gray-500 flex items-center">
                <Info className="h-3 w-3 mr-1" /> AI-Enhanced Analysis with Live Data
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAI ? (
              <p className="py-8 text-gray-600 text-center">Loading AI-enhanced market analysis…</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: aiSections?.marketAnalysis || '' }} />
            )}
          </CardContent>
        </Card>

        {/* Risk Analysis */}
        <RiskAnalysisSection metrics={enhancedMetrics} />

        {/* AI-enhanced Regulatory Analysis */}
        <Card>
          <CardHeader><CardTitle>Jurisdictional & Regulatory Analysis</CardTitle></CardHeader>
          <CardContent>
            {isLoadingAI ? (
              <p className="py-8 text-gray-600 text-center">Loading AI-enhanced regulatory analysis…</p>
            ) : (
              <div dangerouslySetInnerHTML={{ __html: aiSections?.regulatoryAnalysis || '' }} />
            )}
          </CardContent>
        </Card>

        {/* Platform Recommendations */}
        <PlatformRecommendations
          propertyDetails={{
            type : responses.propertyBasics?.propertyType || 'Commercial',
            value: responses.propertyBasics?.valuation?.currentValue || 1_000_000,
            location: responses.propertyBasics?.location?.jurisdiction || 'United Kingdom',
            targetInvestorType : responses.investorProfile?.targetInvestors?.type || 'Institutional',
            minInvestmentTarget: responses.investorProfile?.targetInvestors?.minimumInvestment || 10_000
          }}
        />

        {/* Next Steps */}
        <NextStepsComponent metrics={enhancedMetrics} responses={responses} />

        {/* Exit Strategies */}
        <ExitStrategiesSection
          propertyType={responses.propertyBasics?.propertyType || 'Commercial'}
          propertyValue={responses.propertyBasics?.valuation?.currentValue || 1_000_000}
          tokenizationPercentage={responses.tokenizationGoals?.tokenizationPercentage || 30}
          location={responses.propertyBasics?.location?.jurisdiction || 'United Kingdom'}
        />

        {/* Cost Breakdown */}
        <CostBreakdown responses={responses} />

        {/* Suitability Analysis */}
<Card>
  <CardHeader>
    <CardTitle>Tokenization Suitability Analysis</CardTitle>
  </CardHeader>
  <CardContent>
    {isLoadingAI ? (
      <p className="py-8 text-gray-600 text-center">
        Loading AI-enhanced suitability analysis…
      </p>
    ) : aiSections?.suitability && aiSections.suitability.trim() !== '' ? (
      <div
        dangerouslySetInnerHTML={{ __html: aiSections.suitability }}
      />
    ) : (
      /* fallback – build a quick summary from the numeric score */
      <p className="text-gray-800 leading-relaxed">
        Based on the quantitative score&nbsp;
        <strong>{(suitabilityAnalysis?.score ?? 0).toFixed(1)}/10</strong>,
        this property&nbsp;
        {suitabilityAnalysis?.score >= 8.5
          ? 'is an excellent candidate for tokenization.'
          : suitabilityAnalysis?.score >= 7.5
          ? 'shows strong potential for tokenization.'
          : suitabilityAnalysis?.score >= 6.5
          ? 'may be suitable for tokenization with some optimisation.'
          : 'is currently unlikely to benefit from tokenization without material improvements.'}
      </p>
    )}
  </CardContent>
</Card>

      </div>
    </div>
  );
};

export default TokenizationReport;
