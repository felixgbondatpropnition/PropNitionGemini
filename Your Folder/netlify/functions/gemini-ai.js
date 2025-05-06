const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to generate content with Gemini
async function generateWithGemini(prompt) {
  try {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("Error generating content with Gemini:", error);
    throw error;
  }
}

// Main handler function
exports.handler = async (event) => {
  try {
    const { section, propertyData, marketData } = JSON.parse(event.body || '{}');
    
    // Generate section-specific prompts
    let prompt = "";
    switch (section) {
      case "marketAnalysis":
        prompt = `Generate a detailed market analysis for a ${propertyData.propertyType} in ${propertyData.location}.
Current market conditions: Cap Rate Range: ${marketData.market.capRateRange}, Vacancy Rate: ${marketData.market.vacancyRate}.
Recent news: ${marketData.news.map(item => item.title).join('. ')}.
Regulatory updates: ${marketData.regulatory.latestUpdate}.

Focus on:
1. Current market dynamics and trends
2. Supply and demand analysis
3. Growth projections
4. Investment sentiment
5. Competitive landscape

Format the response in clear paragraphs with professional real estate analysis language.`;
        break;

      case "regulatoryAnalysis":
        prompt = `Generate a regulatory analysis for tokenizing a ${propertyData.propertyType} in ${propertyData.location}.
Key regulatory authority: ${marketData.regulatory.authority}.
Latest update: ${marketData.regulatory.latestUpdate}.
Compliance requirements: ${marketData.regulatory.complianceRequirements.join(', ')}.

Focus on:
1. Current regulatory framework
2. Compliance requirements
3. Recent regulatory changes
4. Implementation considerations
5. Risk mitigation strategies

Format the response in clear paragraphs with professional legal and regulatory language.`;
        break;

      case "financialAnalysis":
        prompt = `Generate a financial analysis for a ${propertyData.propertyType} valued at ${propertyData.value} in ${propertyData.location}.
Current market cap rate range: ${marketData.market.capRateRange}.
Property is in ${propertyData.condition} condition with ${propertyData.occupancyRate}% occupancy.

Focus on:
1. Financial performance metrics
2. Investment potential
3. Risk-adjusted returns
4. Tokenization benefits
5. Cost-benefit analysis

Format the response in clear paragraphs with professional financial analysis language.`;
        break;

      case "aiAdvice":
        prompt = `Provide strategic advice for tokenizing a ${propertyData.propertyType} valued at ${propertyData.value} in ${propertyData.location}.
Current market conditions: ${marketData.market.capRateRange} cap rate, ${marketData.market.vacancyRate} vacancy.
Regulatory environment: ${marketData.regulatory.latestUpdate}.
Additional context: ${propertyData.additionalInfo || "None provided"}.

Focus on:
1. Strategic recommendations
2. Implementation approach
3. Risk mitigation
4. Market positioning
5. Success factors

Format the response in clear paragraphs with actionable professional advice.`;
        break;

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ error: "Invalid section specified" })
        };
    }

    // Generate content using Gemini
    const generatedContent = await generateWithGemini(prompt);

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ content: generatedContent })
    };

  } catch (error) {
    console.error("Error in gemini-ai function:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Failed to generate content" })
    };
  }
};