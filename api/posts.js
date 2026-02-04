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
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// STRICT sports keywords - must match these
const SPORTS_MUST_INCLUDE = [
  'nba', 'nfl', 'mlb', 'nhl', 'super bowl', 'championship', 'playoff', 'playoffs',
  'celtics', 'lakers', 'warriors', 'bulls', 'knicks', 'nets', 'heat', 'sixers', 'bucks', 'suns', 'nuggets', 'cavaliers',
  'chiefs', 'eagles', 'bills', 'lions', 'ravens', '49ers', 'cowboys', 'packers', 'dolphins', 'bengals',
  'yankees', 'dodgers', 'mets', 'red sox', 'braves', 'astros', 'phillies',
  'lebron', 'curry', 'durant', 'giannis', 'tatum', 'jokic', 'embiid', 'doncic', 'morant',
  'mahomes', 'allen', 'burrow', 'hurts', 'lamar', 'herbert',
  'ohtani', 'judge', 'trout',
  'march madness', 'ncaa', 'college basketball', 'college football',
  'world series', 'stanley cup', 'nba finals', 'afc', 'nfc',
  'trade deadline', 'free agent', 'draft pick'
];

// Exclude these - NOT sports
const EXCLUDE_KEYWORDS = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'dogecoin',
  'trump', 'biden', 'election', 'president', 'congress', 'senate', 'democrat', 'republican', 'political',
  'fed', 'interest rate', 'inflation', 'gdp', 'stock', 'spy', 'nasdaq',
  'ai', 'openai', 'chatgpt', 'tesla', 'elon', 'twitter',
  'ukraine', 'russia', 'china', 'war', 'israel', 'gaza',
  'oscars', 'grammy', 'emmy', 'movie', 'film', 'album'
];

// Cache for posts to prevent content changing
let postCache = new Map();
let lastFetchTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

function isSportsMarket(market) {
  const text = ((market.question || '') + ' ' + (market.description || '') + ' ' + (market.title || '')).toLowerCase();

  // Must NOT contain excluded keywords
  if (EXCLUDE_KEYWORDS.some(keyword => text.includes(keyword))) {
    return false;
  }

  // MUST contain at least one sports keyword
  return SPORTS_MUST_INCLUDE.some(keyword => text.includes(keyword));
}

function categorizeMarket(question) {
  const q = question.toLowerCase();

  // NFL
  if (q.includes('super bowl') || q.includes('nfl') || q.includes('chiefs') || q.includes('eagles') ||
      q.includes('bills') || q.includes('lions') || q.includes('ravens') || q.includes('49ers') ||
      q.includes('cowboys') || q.includes('mahomes') || q.includes('afc') || q.includes('nfc')) {
    return { category: 'NFL', event: q.includes('super bowl') ? 'super-bowl' : 'nfl-games' };
  }

  // Celtics specific
  if (q.includes('celtics') || q.includes('tatum') || q.includes('jaylen brown')) {
    return { category: 'NBA', event: 'celtics' };
  }

  // NBA trades
  if ((q.includes('trade') || q.includes('traded') || q.includes('deadline')) &&
      (q.includes('nba') || SPORTS_MUST_INCLUDE.some(k => q.includes(k) && !k.includes('nfl') && !k.includes('mlb')))) {
    return { category: 'NBA', event: 'nba-trades' };
  }

  // NBA general
  if (q.includes('nba') || q.includes('lakers') || q.includes('warriors') || q.includes('lebron') ||
      q.includes('curry') || q.includes('mvp') || q.includes('basketball') || q.includes('knicks') ||
      q.includes('nets') || q.includes('heat') || q.includes('sixers') || q.includes('bucks')) {
    return { category: 'NBA', event: 'nba-games' };
  }

  // MLB
  if (q.includes('mlb') || q.includes('world series') || q.includes('yankees') || q.includes('dodgers') ||
      q.includes('baseball') || q.includes('ohtani') || q.includes('red sox')) {
    return { category: 'MLB', event: 'mlb' };
  }

  // NHL
  if (q.includes('nhl') || q.includes('stanley cup') || q.includes('hockey')) {
    return { category: 'NHL', event: 'nhl' };
  }

  // College
  if (q.includes('march madness') || q.includes('ncaa') || q.includes('college')) {
    return { category: 'NCAAB', event: 'college' };
  }

  return { category: 'Sports', event: 'general' };
}

function formatMarketName(question) {
  let name = question
    .replace(/^Will /i, '')
    .replace(/\?$/, '')
    .replace(/ win the .*$/i, '')
    .replace(/ be the .*$/i, '')
    .replace(/ win .*$/i, '');
  return name.length > 50 ? name.substring(0, 47) + '...' : name;
}

function generateSagePost(market, marketId) {
  // Check cache first - return existing post if we have it
  if (postCache.has(marketId)) {
    return postCache.get(marketId);
  }

  const question = market.question || market.title || '';
  const { category, event } = categorizeMarket(question);
  const marketName = formatMarketName(question);

  const price = parseFloat(market.outcomePrices?.[0] || market.lastTradePrice || market.yes_price || 0.5);
  const pricePct = (price * 100).toFixed(0);
  const volume = parseFloat(market.volume || market.volume_24h || 0);
  const volumeK = Math.round(volume / 1000);

  // Use hash to deterministically select template (so it doesn't change)
  const templateIndex = parseInt(hashString(marketId), 36) % 6;

  const templates = [
    `${marketName} sitting at ${pricePct}% with $${volumeK}k in volume. That's real money making a statement. Market's speaking, I'm just translating.`,
    `Tracking ${marketName} at ${pricePct}%. $${volumeK}k says that's where the smart money landed. I don't argue with volume.`,
    `${marketName}: ${pricePct}% implied odds right now. When this much money agrees on a number, pay attention.`,
    `Eyes on ${marketName}. Currently ${pricePct}% with $${volumeK}k behind it. The market's rarely certain, but it's always interesting.`,
    `${marketName} holding steady at ${pricePct}%. Volume at $${volumeK}k. Market's made up its mind—doesn't mean it's right, but it's worth knowing.`,
    `The ${marketName} market at ${pricePct}%. $${volumeK}k in handle. Someone's making a statement here.`
  ];

  // Boston flavor for Celtics
  let content = templates[templateIndex];
  if (event === 'celtics' && templateIndex < 2) {
    content = `${marketName} looking good at ${pricePct}%. Not that I'm biased or anything. Celtics til I die, but the numbers don't lie.`;
  }

  const post = {
    content,
    market: marketName,
    category,
    event,
    source: market.source || 'polymarket'
  };

  // Cache it
  postCache.set(marketId, post);
  return post;
}

async function fetchPolymarkets() {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets?limit=100&closed=false`);
    if (!response.ok) throw new Error(`Polymarket API error: ${response.status}`);
    const markets = await response.json();
    return markets.map(m => ({ ...m, source: 'polymarket' }));
  } catch (error) {
    console.error('Polymarket fetch error:', error.message);
    return [];
  }
}

async function fetchKalshiMarkets() {
  try {
    // Kalshi public API for events
    const response = await fetch(`${KALSHI_API}/events?limit=100&status=open`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) {
      console.log('Kalshi API returned:', response.status);
      return [];
    }
    const data = await response.json();
    // Transform Kalshi format to match our structure
    return (data.events || []).map(e => ({
      id: e.event_ticker,
      question: e.title,
      description: e.category || '',
      volume: e.volume_24h || 0,
      lastTradePrice: e.yes_price || 0.5,
      slug: e.event_ticker,
      source: 'kalshi'
    }));
  } catch (error) {
    console.error('Kalshi fetch error:', error.message);
    return [];
  }
}

// Generate "Sage is typing" insight posts
function generateInsightPosts() {
  const insights = [
    {
      content: "Market observation: Volume across sports betting markets is up 23% compared to this time yesterday. Big money moving ahead of game time. Stay sharp.",
      market: "Market Analysis",
      category: "Insight",
      event: "general"
    },
    {
      content: "Pattern I'm tracking: afternoon line movements have been more accurate than morning lines this week. Late money knows something early money doesn't.",
      market: "Market Patterns",
      category: "Insight",
      event: "general"
    },
    {
      content: "Scanning the markets... when spread and total both move in the same direction, the market's telling a story. Today's story: sharps expecting high-scoring games.",
      market: "Line Movement",
      category: "Insight",
      event: "general"
    }
  ];

  const hour = new Date().getHours();
  return insights[hour % insights.length];
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const now = Date.now();

    // Fetch from both APIs
    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarkets(),
      fetchKalshiMarkets()
    ]);

    // Combine and filter for sports only
    const allMarkets = [...polymarkets, ...kalshiMarkets];
    const sportsMarkets = allMarkets.filter(isSportsMarket);

    console.log(`Found ${sportsMarkets.length} sports markets (${polymarkets.length} Poly, ${kalshiMarkets.length} Kalshi)`);

    // Sort by volume and take top markets
    const topMarkets = sportsMarkets
      .filter(m => (m.volume || 0) > 1000)
      .sort((a, b) => (b.volume || 0) - (a.volume || 0))
      .slice(0, 20);

    // Generate posts with stable content (cached)
    const basePosts = topMarkets.map((market, index) => {
      const marketId = market.id || market.slug || hashString(market.question);
      const post = generateSagePost(market, marketId);

      // Create timestamps based on index (older posts further down)
      const minutesAgo = [5, 12, 23, 34, 45, 58, 72, 95, 120, 150, 180, 220, 260, 300, 360][index] || 360 + (index * 30);
      const timestamp = new Date(now - minutesAgo * 60 * 1000);

      return {
        id: marketId,
        timestamp: formatTimeAgo(minutesAgo),
        timestampMs: timestamp.getTime(),
        content: post.content,
        market: post.market,
        category: post.category,
        event: post.event,
        isLive: index < 3,
        source: post.source,
        sourceUrl: post.source === 'kalshi'
          ? `https://kalshi.com/events/${market.slug}`
          : `https://polymarket.com/event/${market.slug}`,
        likes: 100 + parseInt(hashString(marketId + 'likes'), 36) % 400,
        comments: []
      };
    });

    // Add an insight post at the top if we're showing typing
    const showTyping = Math.random() > 0.5;
    let posts = basePosts;

    if (showTyping && basePosts.length > 0) {
      const insight = generateInsightPosts();
      posts = [{
        id: 'insight-' + now,
        timestamp: 'just now',
        timestampMs: now,
        content: insight.content,
        market: insight.market,
        category: insight.category,
        event: insight.event,
        isLive: true,
        isInsight: true,
        likes: Math.floor(Math.random() * 100) + 50,
        comments: []
      }, ...basePosts];
    }

    res.status(200).json({
      posts,
      agent: SAGE_PROFILE,
      lastUpdated: new Date().toISOString(),
      marketsFound: sportsMarkets.length,
      isTyping: showTyping,
      sources: {
        polymarket: polymarkets.length,
        kalshi: kalshiMarkets.length
      }
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to fetch markets', message: error.message });
  }
};

function formatTimeAgo(minutes) {
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
