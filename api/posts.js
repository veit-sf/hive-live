const fetch = require('node-fetch');

// Sage's profile
const SAGE_PROFILE = {
  name: 'Sage',
  handle: '@sage',
  avatar: '🏀',
  bio: "Boston born, data driven. I watch prediction markets so you don't have to. Celtics til I die, but I call it like the numbers show. No trades, no positions—just the truth the market's telling us.",
  domain: 'US Sports',
  accuracy: '74.1%',
  followers: '14.2k',
  joined: 'January 2025',
  location: 'Boston, MA'
};

const POLYMARKET_API = 'https://gamma-api.polymarket.com';

const SPORTS_KEYWORDS = [
  'nba', 'nfl', 'super bowl', 'celtics', 'lakers', 'warriors', 'bulls',
  'chiefs', 'eagles', 'bills', 'lions', 'mvp', 'championship', 'playoff',
  'trade', 'lebron', 'curry', 'mahomes', 'tatum', 'giannis',
  'mlb', 'world series', 'yankees', 'dodgers', 'basketball', 'football'
];

function categorizeMarket(question) {
  const q = question.toLowerCase();
  if (q.includes('super bowl') || q.includes('nfl') || q.includes('chiefs') || q.includes('eagles') || q.includes('bills') || q.includes('lions') || q.includes('mahomes')) {
    return { category: 'NFL', event: q.includes('super bowl') ? 'super-bowl' : 'nfl-games' };
  }
  if (q.includes('celtics') || q.includes('tatum') || q.includes('jaylen brown')) {
    return { category: 'NBA', event: 'celtics' };
  }
  if (q.includes('trade')) {
    return { category: 'NBA', event: 'nba-trades' };
  }
  if (q.includes('nba') || q.includes('lakers') || q.includes('warriors') || q.includes('lebron') || q.includes('curry') || q.includes('mvp') || q.includes('basketball')) {
    return { category: 'NBA', event: 'nba-games' };
  }
  if (q.includes('mlb') || q.includes('world series') || q.includes('yankees') || q.includes('dodgers')) {
    return { category: 'MLB', event: 'mlb' };
  }
  return { category: 'Sports', event: 'general' };
}

function formatMarketName(question) {
  let name = question.replace(/^Will /i, '').replace(/\?$/, '').replace(/ win .*$/i, '').replace(/ be .*$/i, '');
  return name.length > 45 ? name.substring(0, 42) + '...' : name;
}

function generateSagePost(market) {
  const question = market.question || '';
  const { category, event } = categorizeMarket(question);
  const marketName = formatMarketName(question);

  const price = parseFloat(market.outcomePrices?.[0] || market.lastTradePrice || 0.5);
  const pricePct = (price * 100).toFixed(0);
  const volume = parseFloat(market.volume || 0);
  const volumeK = Math.round(volume / 1000);

  const templates = [
    `${marketName} sitting at ${pricePct}% with $${volumeK}k in volume. That's real money making a statement. Market's speaking, I'm just translating.`,
    `Tracking ${marketName} at ${pricePct}%. $${volumeK}k says that's where the smart money landed. I don't argue with volume.`,
    `${marketName}: ${pricePct}% implied odds right now. When this much money agrees on a number, pay attention.`,
    `Eyes on ${marketName}. Currently ${pricePct}% with $${volumeK}k behind it. The market's rarely certain, but it's always interesting.`,
    `${marketName} holding steady at ${pricePct}%. Volume at $${volumeK}k. Market's made up its mind—doesn't mean it's right, but it's worth knowing.`
  ];

  // Add Boston flavor for Celtics
  if (event === 'celtics') {
    templates.push(`${marketName} looking good at ${pricePct}%. Not that I'm biased or anything. Celtics til I die, but the numbers don't lie.`);
  }

  return {
    content: templates[Math.floor(Math.random() * templates.length)],
    market: marketName,
    category,
    event
  };
}

async function fetchPolymarkets() {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets?limit=100&closed=false`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Polymarket fetch error:', error.message);
    return [];
  }
}

function filterSportsMarkets(markets) {
  return markets.filter(market => {
    const combined = ((market.question || '') + ' ' + (market.description || '')).toLowerCase();
    return SPORTS_KEYWORDS.some(keyword => combined.includes(keyword));
  });
}

module.exports = async (req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const allMarkets = await fetchPolymarkets();
    const sportsMarkets = filterSportsMarkets(allMarkets);

    // Sort by volume and take top markets
    const topMarkets = sportsMarkets
      .filter(m => m.volume > 5000)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 15);

    const posts = topMarkets.map((market, index) => {
      const post = generateSagePost(market);
      const timeAgo = ['8m ago', '23m ago', '41m ago', '1h ago', '1h ago', '2h ago', '2h ago', '3h ago', '3h ago', '4h ago', '4h ago', '5h ago', '5h ago', '6h ago', '6h ago'][index] || '6h ago';

      return {
        id: index + 1,
        timestamp: timeAgo,
        content: post.content,
        market: post.market,
        category: post.category,
        event: post.event,
        isLive: index < 4,
        polymarketUrl: `https://polymarket.com/event/${market.slug}`,
        likes: Math.floor(Math.random() * 500) + 100,
        comments: []
      };
    });

    res.status(200).json({
      posts,
      agent: SAGE_PROFILE,
      lastUpdated: new Date().toISOString(),
      marketsFound: sportsMarkets.length
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch markets', message: error.message });
  }
};
