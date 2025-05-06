```typescript
import { marked } from 'marked';

export const renderExecutiveSummaryText = (responses: any) => {
  const propertyType = responses?.propertyBasics?.propertyType || 'property';
  const location = responses?.propertyBasics?.location?.jurisdiction || 'selected jurisdiction';
  const value = responses?.propertyBasics?.valuation?.currentValue || 0;
  
  return marked.parse(`
# Executive Summary

This analysis examines the tokenization potential for a ${propertyType} valued at $${value.toLocaleString()} in ${location}.

## Key Points
- Property Type: ${propertyType}
- Location: ${location}
- Current Value: $${value.toLocaleString()}
- Tokenization Timeline: ${responses?.tokenizationGoals?.timeframe || 'To be determined'}
  `);
};

export const renderFinancialText = (responses: any) => {
  return marked.parse(`
# Financial Analysis

Analysis of key financial metrics and performance indicators for the property.

## Financial Metrics
- Current Value: $${responses?.propertyBasics?.valuation?.currentValue?.toLocaleString() || 'N/A'}
- Monthly Income: $${responses?.financialMetrics?.incomeGeneration?.monthlyGrossIncome?.toLocaleString() || 'N/A'}
- Occupancy Rate: ${responses?.propertyDetails?.occupancyRate || 'N/A'}%
  `);
};

export const renderRiskText = (metrics: any) => {
  return marked.parse(`
# Risk Analysis

Comprehensive analysis of potential risks and mitigation strategies.

## Risk Categories
- Market Risk: ${metrics?.risk?.marketRisk || 'N/A'}/10
- Property Risk: ${metrics?.risk?.propertyRisk || 'N/A'}/10
- Financial Risk: ${metrics?.risk?.financialRisk || 'N/A'}/10
  `);
};

export const renderNextStepsText = (metrics: any) => {
  return marked.parse(`
# Next Steps

Recommended actions and implementation timeline.

## Implementation Plan
1. Legal Structure Setup
2. Technical Implementation
3. Platform Integration
4. Token Launch Preparation
  `);
};

export const renderExitStrategiesText = (responses: any) => {
  return marked.parse(`
# Exit Strategies

Analysis of potential exit strategies and liquidity options.

## Available Strategies
1. Secondary Market Trading
2. Whole Property Sale
3. Token Buyback Program
  `);
};

export const renderCostText = (responses: any) => {
  return marked.parse(`
# Cost Analysis

Breakdown of implementation and ongoing costs.

## Cost Categories
- Legal & Structure
- Technical Implementation
- Marketing & Distribution
- Platform & Integration
  `);
};

export const renderSuitabilityText = (analysis: any) => {
  return marked.parse(`
# Suitability Analysis

Assessment of property's suitability for tokenization.

## Overall Score: ${analysis?.score || 'N/A'}/10

### Key Factors
${analysis?.factors?.map((f: any) => `- ${f.name}: ${f.score}/10`).join('\n') || 'No factors available'}
  `);
};
`