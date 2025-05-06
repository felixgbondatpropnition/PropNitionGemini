import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Alert, AlertTitle, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ArrowUpRight, TrendingUp, Building, Users, DollarSign, AlertTriangle, ChevronUp, ChevronDown, Activity, Info, CheckCircle } from 'lucide-react';
import PlatformRecommendations from './PlatformRecommendations';
import { calculateEnhancedMetrics } from './enhanced-analysis';
import { generateAIEnhancedReport } from '../utils/aiReportGenerator';
import { 
  MarketAnalysisSection,
  RiskAnalysisSection,
  TokenizationAnalysisSection,
  JurisdictionalAnalysisSection
} from './enhanced-report-sections';
import { 
  AnalysisExplanation,
  marketExplanation,
  riskExplanation,
  tokenizationExplanation,
  projectionExplanation
} from './explanation-components';
import BenchmarkPanel from './benchmark-panel';
import NextStepsComponent from './next-steps-component';
import ExitStrategiesSection from './exit-strategies/ExitStrategiesSection';
import ExecutiveSummary from './report-sections/ExecutiveSummary';
import FinancialAnalytics from './report-sections/FinancialAnalytics';
import CostBreakdown from './report-sections/CostBreakdown';
import { calculateTokenizationSuitabilityScore } from '../utils/ReportGenerator';
import _ from 'lodash';

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

const TokenizationReport: React.FC<TokenizationReportProps> = ({ responses, additionalInfo }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'10yr' | '20yr'>('20yr');
  const [enhancedMetrics, setEnhancedMetrics] = useState<any>(null);
  const [benchmarkData, setBenchmarkData] = useState<any>(null);
  const [suitabilityAnalysis, setSuitabilityAnalysis] = useState<any>(null);
  const [aiSections, setAiSections] = useState<Record<string, string> | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);

  useEffect(() => {
    // Calculate suitability score
    const analysis = calculateTokenizationSuitabilityScore(responses);
    setSuitabilityAnalysis(analysis);

    // Ensure financial data is available by providing defaults if missing
    const updatedResponses = {
      ...responses,
      propertyBasics: {
        ...responses.propertyBasics,
        valuation: {
          ...responses.propertyBasics?.valuation,
          currentValue: responses.propertyBasics?.valuation?.currentValue || 1000000
        },
        propertyType: responses.propertyBasics?.propertyType || 'Commercial office',
        location: {
          ...responses.propertyBasics?.location,
          jurisdiction: responses.propertyBasics?.location?.jurisdiction || 'United Kingdom'
        }
      },
      tokenizationGoals: {
        ...responses.tokenizationGoals,
        tokenizationPercentage: responses.tokenizationGoals?.tokenizationPercentage || 30,
        primaryMotivation: responses.tokenizationGoals?.primaryMotivation || 'Raising capital',
        timeframe: responses.tokenizationGoals?.timeframe || 'Medium-term (6-12 months)'
      },
      financialMetrics: {
        ...responses.financialMetrics,
        incomeGeneration: {
          ...responses.financialMetrics?.incomeGeneration,
          monthlyGrossIncome: responses.financialMetrics?.incomeGeneration?.monthlyGrossIncome || 8000,
          currentlyGeneratingIncome: responses.financialMetrics?.incomeGeneration?.currentlyGeneratingIncome || 'Yes'
        },
        annualOperatingExpenses: responses.financialMetrics?.annualOperatingExpenses || 38400,
        financing: {
          ...responses.financialMetrics?.financing,
          hasDebt: responses.financialMetrics?.financing?.hasDebt || 'Yes',
          loanAmount: responses.financialMetrics?.financing?.loanAmount || 700000,
          interestRate: responses.financialMetrics?.financing?.interestRate || 5.5,
          loanTerm: responses.financialMetrics?.financing?.loanTerm || 25
        },
        capRate: responses.financialMetrics?.capRate || 5.8,
        potentialRentalIncome: responses.financialMetrics?.potentialRentalIncome || 96000
      },
      propertyDetails: {
        ...responses.propertyDetails,
        occupancyRate: responses.propertyDetails?.occupancyRate || 95,
        condition: responses.propertyDetails?.condition || 'Good'
      }
    };
    
    const metrics = calculateEnhancedMetrics(updatedResponses);
    setEnhancedMetrics(metrics);
    
    const propertyType = updatedResponses?.propertyBasics?.propertyType || 'Commercial';
    const location = updatedResponses?.propertyBasics?.location?.jurisdiction || 'United Kingdom';
    
    let capRateBenchmark = 5.8;
    let expenseRatioBenchmark = 42;
    let occupancyBenchmark = 92;
    
    if (propertyType.includes('Residential')) {
      capRateBenchmark = 4.5;
      expenseRatioBenchmark = 38;
      occupancyBenchmark = 95;
    } else if (propertyType.includes('Retail')) {
      capRateBenchmark = 6.2;
      expenseRatioBenchmark = 35;
      occupancyBenchmark = 90;
    } else if (propertyType.includes('Industrial')) {
      capRateBenchmark = 5.5;
      expenseRatioBenchmark = 30;
      occupancyBenchmark = 94;
    }
    
    if (location === 'United States') {
      capRateBenchmark += 0.3;
    } else if (location === 'European Union') {
      capRateBenchmark -= 0.2;
    } else if (location === 'Asia Pacific') {
      capRateBenchmark += 0.5;
    }
    
    setBenchmarkData({
      capRate: capRateBenchmark,
      operatingExpenseRatio: expenseRatioBenchmark,
      occupancyRate: occupancyBenchmark,
      tokenizedCapRate: capRateBenchmark + 0.4,
      tokenizedOperatingExpenseRatio: expenseRatioBenchmark - 4,
      tokenizedOccupancyRate: occupancyBenchmark + 2
    });

    /* 1 ▸ Build plain-text versions of every section (placeholders ok) */
    const baseSections = {
      executiveSummary: renderExecutiveSummaryText(),
      financialAnalytics: renderFinancialText(),
      riskAnalysis: renderRiskText(),
      marketAnalysis: localMarketText,
      regulatoryAnalysis: localRegText,
      financialAnalysis: localFinText,
      aiAdvice: localAdviceText,
      nextSteps: renderNextStepsText(),
      exitStrategies: renderExitStrategiesText(),
      costBreakdown: renderCostText(),
      suitability: renderSuitabilityText()
    };

    /* 2 ▸ Show base text immediately so the page renders in Bolt preview */
    setAiSections(baseSections);

    /* 3 ▸ Async call to Gemini – will only succeed on Netlify */
    async function runAI() {
      try {
        setIsLoadingAI(true);
        const updated = await generateAIEnhancedReport(
          responses,
          baseSections,
          { enhancedMetrics, benchmarkData, suitabilityAnalysis }
        );
        setAiSections(updated);
      } catch {
        /* In Bolt preview the function 404s – keep placeholders silently */
      } finally {
        setIsLoadingAI(false);
      }
    }
    runAI();
  }, [responses, enhancedMetrics]);

  if (!enhancedMetrics || !benchmarkData || !suitabilityAnalysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Analyzing Data</h2>
          <p className="text-gray-600">Please wait while we generate your comprehensive report...</p>
        </div>
      </div>
    );
  }

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
                This report is provided for educational and informational purposes only. It does not constitute financial, legal, or investment advice. 
                Always consult with qualified professionals before making any investment decisions regarding property tokenization.
              </p>
            </div>
          </div>
        </div>

        {/* Title and Date */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-3">
            Comprehensive Property Tokenization Analysis
          </h1>
          <p className="text-gray-600">Generated on {new Date().toLocaleDateString()}</p>
        </div>

        {/* Executive Summary */}
        <div className="mb-16">
          <ExecutiveSummary responses={responses} />
        </div>

        {/* Financial Analytics */}
        <div className="mb-16">
          <FinancialAnalytics responses={responses} />
        </div>

        {/* AI-Enhanced Market Analysis */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Market Analysis</span>
                <div className="text-xs text-gray-500 flex items-center">
                  <Info className="h-3 w-3 mr-1" />
                  <span>AI-Enhanced Analysis with Live Data</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAI ? (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Loading AI-enhanced market analysis...</p>
                </div>
              ) : aiSections?.marketAnalysis ? (
                <div dangerouslySetInnerHTML={{ __html: aiSections.marketAnalysis }} />
              ) : (
                <MarketAnalysisSection metrics={enhancedMetrics} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Risk Analysis */}
        <div className="mb-16">
          <RiskAnalysisSection metrics={enhancedMetrics} />
        </div>

        {/* AI-Enhanced Regulatory Analysis */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Jurisdictional & Regulatory Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAI ? (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Loading AI-enhanced regulatory analysis...</p>
                </div>
              ) : aiSections?.regulatoryAnalysis ? (
                <div dangerouslySetInnerHTML={{ __html: aiSections.regulatoryAnalysis }} />
              ) : (
                <JurisdictionalAnalysisSection metrics={enhancedMetrics} />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Platform Recommendations */}
        <div className="mb-16">
          <Card>
            <CardHeader>
              <CardTitle>Platform Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                We recommend scheduling discovery calls to the platforms we have recommended to compare their specific offerings and fee structures.
              </p>
              <PlatformRecommendations
                propertyDetails={{
                  type: responses?.propertyBasics?.propertyType || 'Commercial',
                  value: responses?.propertyBasics?.valuation?.currentValue || 1000000,
                  location: responses?.propertyBasics?.location?.jurisdiction || 'United Kingdom',
                  targetInvestorType: responses?.investorProfile?.targetInvestors?.type || "Institutional",
                  minInvestmentTarget: responses?.investorProfile?.targetInvestors?.minimumInvestment || 10000
                }}
              />
            </CardContent>
          </Card>
        </div>

        {/* Implementation Timeline and Next Steps */}
        <div className="mb-16">
          <NextStepsComponent metrics={enhancedMetrics} responses={responses} />
        </div>

        {/* Exit Strategies */}
        <div className="mb-16">
          <ExitStrategiesSection
            propertyType={responses?.propertyBasics?.propertyType || 'Commercial'}
            propertyValue={responses?.propertyBasics?.valuation?.currentValue || 1000000}
            tokenizationPercentage={responses?.tokenizationGoals?.tokenizationPercentage || 30}
            location={responses?.propertyBasics?.location?.jurisdiction || 'United Kingdom'}
          />
        </div>

        {/* Cost Breakdown */}
        <div className="mb-16">
          <CostBreakdown responses={responses} />
        </div>

        {/* Tokenization Suitability Analysis */}
        <div className="mb-8">
          <Card>
            <CardHeader>
              <CardTitle>Tokenization Suitability Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingAI ? (
                <div className="py-8 text-center">
                  <p className="text-gray-600">Loading AI-enhanced suitability analysis...</p>
                </div>
              ) : aiSections?.suitability ? (
                <div dangerouslySetInnerHTML={{ __html: aiSections.suitability }} />
              ) : (
                <div className="space-y-6">
                  <div className="p-6 bg-blue-50 rounded-lg">
                    <h3 className="text-xl font-semibold text-blue-900 mb-4">Property Tokenization Assessment</h3>
                    <p className="text-blue-800 mb-4">
                      Based on our comprehensive analysis of your {responses?.propertyBasics?.propertyType?.toLowerCase() || 'property'} in {responses?.propertyBasics?.location?.jurisdiction || 'your jurisdiction'}, 
                      {suitabilityAnalysis.score >= 8.5 ? (
                        " your property shows excellent potential for tokenization. The combination of strong fundamentals, favorable market conditions, and robust financial metrics indicates a high likelihood of successful tokenization."
                      ) : suitabilityAnalysis.score >= 7.5 ? (
                        " your property demonstrates strong potential for tokenization. While there are some areas that could be optimized, the overall profile suggests a good foundation for a successful tokenization project."
                      ) : suitabilityAnalysis.score >= 6.5 ? (
                        " your property shows moderate potential for tokenization. While tokenization is feasible, there are several areas that should be strengthened to enhance the likelihood of success."
                      ) : (
                        " your property may face some challenges in tokenization. We recommend addressing key areas of improvement before proceeding with tokenization."
                      )}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TokenizationReport;