require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

// Mock news headlines for demo (in real app, would call news API)
const MOCK_NEWS_HEADLINES = {
  normal: [
    { title: "South Bend Mayor Announces New Park", snippet: "City plans to open community green space next spring" },
    { title: "Local High School Wins Basketball Championship", snippet: "Eagles defeat rivals in overtime thriller" },
    { title: "New Restaurant Opens Downtown", snippet: "Farm-to-table eatery celebrates grand opening" }
  ],
  winterStorm: [
    { title: "WEATHER ALERT: Major Winter Storm Warning for South Bend", snippet: "National Weather Service issues warning for 12-18 inches of snow, high winds expected Friday-Saturday" },
    { title: "Residents Urged to Stock Up as Storm Approaches", snippet: "Emergency officials recommend having 3 days of supplies, avoid travel during storm" },
    { title: "School Districts Announce Closures", snippet: "Multiple counties canceling classes Friday due to severe weather forecast" }
  ],
  economicCrisis: [
    { title: "Major Employer Announces Layoffs", snippet: "AM General to cut 500 jobs at South Bend plant, affecting hundreds of families" },
    { title: "Food Pantries See Surge in Demand", snippet: "Local charities report 40% increase in families seeking assistance" },
    { title: "Economic Anxiety Grows in Region", snippet: "Manufacturing sector downturn impacts community" }
  ]
};

// Analyze news for crisis using Claude
async function analyzeCrisisWithClaude(newsHeadlines) {
  const headlinesText = newsHeadlines
    .map(h => `- ${h.title}: ${h.snippet}`)
    .join('\n');
  
  const prompt = `Analyze these South Bend news headlines for food bank impact:

${headlinesText}

Determine:
1. Is there a crisis event that would increase food bank demand? (yes/no)
2. Event type: (winter_storm, flood, economic_shock, holiday_surge, heat_wave, none)
3. Severity: (low, medium, high)
4. Projected demand impact: (normal=1.0, moderate=2.0, severe=3.0)
5. Brief reasoning (1 sentence)

Return ONLY valid JSON in this exact format:
{
  "is_crisis": true,
  "event_type": "winter_storm",
  "severity": "high",
  "demand_multiplier": 2.5,
  "reasoning": "Major storm will disrupt transportation and increase demand"
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 512,
      messages: [{ role: "user", content: prompt }]
    });
    
    const responseText = message.content[0].text.trim();
    
    // Extract JSON (Claude might wrap it in markdown)
    let jsonText = responseText;
    if (responseText.includes('```json')) {
      jsonText = responseText.split('```json')[1].split('```')[0].trim();
    } else if (responseText.includes('```')) {
      jsonText = responseText.split('```')[1].split('```')[0].trim();
    }
    
    return JSON.parse(jsonText);
    
  } catch (error) {
    console.error('Error analyzing crisis:', error.message);
    return {
      is_crisis: false,
      event_type: 'none',
      severity: 'low',
      demand_multiplier: 1.0,
      reasoning: 'Error analyzing news'
    };
  }
}

// Main crisis detection function - can use Firebase analytics or mock data
async function detectCrisis(analytics = null, scenario = null) {
  // If analytics has currentCrisis, use that
  if (analytics?.currentCrisis?.active) {
    const crisis = analytics.currentCrisis;
    return {
      is_crisis: true,
      event_type: crisis.type || 'unknown',
      severity: crisis.severity || 'medium',
      demand_multiplier: crisis.projectedDemandIncrease || 2.0,
      reasoning: crisis.description || 'Active crisis detected in database'
    };
  }
  
  // Otherwise, use mock news based on scenario
  const newsScenario = scenario || 'normal';
  const headlines = MOCK_NEWS_HEADLINES[newsScenario] || MOCK_NEWS_HEADLINES.normal;
  
  return await analyzeCrisisWithClaude(headlines);
}

// Get mock news for testing
function getMockNews(scenario = 'normal') {
  return MOCK_NEWS_HEADLINES[scenario] || MOCK_NEWS_HEADLINES.normal;
}

module.exports = {
  detectCrisis,
  analyzeCrisisWithClaude,
  getMockNews,
  MOCK_NEWS_HEADLINES
};

