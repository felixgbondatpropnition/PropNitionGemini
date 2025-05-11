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
import NextStepsComponent      from './next-steps-component';
import ExitStrategiesSection   from './exit-strategies/ExitStrategiesSection';
import ExecutiveSummary        from './report-sections/ExecutiveSummary';
import FinancialAnalytics      from './report-sections/FinancialAnalytics';
import CostBreakdown           from './report-sections/CostBreakdown';

import { calculateEnhancedMetrics } from './enhanced-analysis';
import { calculateTokenizationSuitabilityScore } from '../utils/ReportGenerator';
import { generateAIEnhancedReport } from '../utils/aiReportGenerator';

/* ───── placeholders shown until Gemini responds ───── */
const localMarketText  = 'Market analysis will appear here.';
const localRegText     = 'Regulatory analysis will appear here.';
const localFinText     = 'Financial analysis will appear here.';
const localAdvText     = 'General advice will appear here.';
/* ──────────────────────────────────────────────────── */

interface TokenizationReportProps {
  responses: any;
}

const TokenizationReport: React.FC<TokenizationReportProps> = ({ responses }) => {
  const [enhancedMetrics, setEnhancedMetrics] = useState<any>(null);
  const [benchmarkData,  setBenchmarkData]   = useState<any>(null);
  const [aiSections,     setAiSections]      = useState<Record<string,string>|null>(null);
  const [isLoadingAI,    setIsLoadingAI]     = useState(false);

  /* ───────── run once per questionnaire submission ───────── */
  useEffect(() => {
    /* 1 ▸ safe numeric defaults, then local calculations ---- */
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
      }
    };

    const metrics = calculateEnhancedMetrics(safe);
    setEnhancedMetrics(metrics);

    /* simple, static example benchmarks */
    setBenchmarkData({
      capRate: 5.8, operatingExpenseRatio: 42, occupancyRate: 92,
      tokenizedCapRate: 6.2, tokenizedOperatingExpenseRatio: 38, tokenizedOccupancyRate: 94
    });

    /* 2 ▸ placeholders so UI doesn’t flash empty ------------- */
    const baseSections = {
      marketAnalysis    : localMarketText,
      regulatoryAnalysis: localRegText,
      financialAnalysis : localFinText,
      generalAdvice     : localAdvText
    };
    setAiSections(baseSections);

    /* 3 ▸ call the Netlify Function (Gemini) ---------------- */
    async function runAI() {
      try {
        setIsLoadingAI(true);

        const updated = await generateAIEnhancedReport(
          responses,
          baseSections,
          {
            enhancedMetrics: metrics,
            benchmarkData,
            suitabilityAnalysis: calculateTokenizationSuitabilityScore(safe)
          }
        );

        setAiSections(prev => ({ ...(prev || {}), ...updated }));
      } catch {
        /* silent locally (function 404s in Bolt preview) */
      } finally {
        setIsLoadingAI(false);
      }
    }
    runAI();
  }, [responses]);
  /* ───────────────────────────────────────────────────────── */

  if (!enhancedMetrics || !benchmarkData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Generating report…</p>
      </div>
    );
  }

  /* ------------------------ RENDER ------------------------ */
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="max-w-6xl mx-auto px-4 space-y-12">

        {/* Notice */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <AlertTriangle className="h-5 w-5 text-amber-600 mr-2 inline" />
          <span className="text-sm text-amber-700">
            Educational use only – not financial or legal advice.
          </span>
        </div>

        {/* Header */}
        <h1 className="text-3xl font-bold text-center">
          Comprehensive Property Tokenization Analysis
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Generated on {new Date().toLocaleDateString()}
        </p>

        {/* Static sections */}
        <ExecutiveSummary   responses={responses} />
        <FinancialAnalytics responses={responses} />

        {/* Market Analysis (AI) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Market Analysis</span>
              <span className="text-xs text-gray-500 flex items-center">
                <Info className="h-3 w-3 mr-1" /> AI + Live Data
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingAI
              ? <p className="py-8 text-gray-600 text-center">Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: aiSections?.marketAnalysis || '' }} />}
          </CardContent>
        </Card>

        {/* Risk (local) */}
        <RiskAnalysisSection metrics={enhancedMetrics} />

        {/* Regulatory Analysis (AI) */}
        <Card>
          <CardHeader><CardTitle>Jurisdictional & Regulatory Analysis</CardTitle></CardHeader>
          <CardContent>
            {isLoadingAI
              ? <p className="py-8 text-gray-600 text-center">Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: aiSections?.regulatoryAnalysis || '' }} />}
          </CardContent>
        </Card>

        {/* General Advice (AI) */}
        <Card>
          <CardHeader><CardTitle>General Advice</CardTitle></CardHeader>
          <CardContent>
            {isLoadingAI
              ? <p className="py-8 text-gray-600 text-center">Loading…</p>
              : <div dangerouslySetInnerHTML={{ __html: aiSections?.generalAdvice || '' }} />}
          </CardContent>
        </Card>

        {/* Remaining local / static helpers */}
        <PlatformRecommendations
          propertyDetails={{
            type : responses.propertyBasics?.propertyType || 'Commercial',
            value: responses.propertyBasics?.valuation?.currentValue || 1_000_000,
            location: responses.propertyBasics?.location?.jurisdiction || 'United Kingdom',
            targetInvestorType : responses.investorProfile?.targetInvestors?.type || 'Institutional',
            minInvestmentTarget: responses.investorProfile?.targetInvestors?.minimumInvestment || 10_000
          }}
        />

        <NextStepsComponent    metrics={enhancedMetrics} responses={responses} />

        <ExitStrategiesSection
          propertyType={responses.propertyBasics?.propertyType || 'Commercial'}
          propertyValue={responses.propertyBasics?.valuation?.currentValue || 1_000_000}
          tokenizationPercentage={responses.tokenizationGoals?.tokenizationPercentage || 30}
          location={responses.propertyBasics?.location?.jurisdiction || 'United Kingdom'}
        />

        <CostBreakdown responses={responses} />
      </div>
    </div>
  );
};

export default TokenizationReport;
