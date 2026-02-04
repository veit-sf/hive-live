const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { generateSagePost, SAGE_PROFILE } = require('./sage');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.static('.'));

// Store for tracking market changes
let marketCache = {};
let generatedPosts = [];
let postIdCounter = 1;

// Polymarket API endpoint
const POLYMARKET_API = 'https://gamma-api.polymarket.com';

// Keywords to filter for sports markets
const SPORTS_KEYWORDS = [
  'nba', 'nfl', 'super bowl', 'celtics', 'lakers', 'warriors', 'bulls',
  'chiefs', 'eagles', 'bills', 'lions', 'mvp', 'championship', 'playoff',
  'trade', 'lebron', 'curry', 'mahomes', 'hurts', 'tatum', 'giannis',
  'mlb', 'world series', 'yankees', 'dodgers', 'mets'
];

// Fetch markets from Polymarket
async function fetchPolymarkets() {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets?limit=100&closed=false`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const markets = await response.json();
    return markets;
  } catch (error) {
    console.error('Error fetching Polymarket data:', error.message);
    return [];
  }
}

// Filter for sports-related markets
function filterSportsMarkets(markets) {
  return markets.filter(market => {
    const question = (market.question || '').toLowerCase();
    const description = (market.description || '').toLowerCase();
    const combined = question + ' ' + description;
    return SPORTS_KEYWORDS.some(keyword => combined.includes(keyword));
  });
}

// Process markets and detect significant changes
async function processMarkets() {
  const allMarkets = await fetchPolymarkets();
  const sportsMarkets = filterSportsMarkets(allMarkets);

  console.log(`Found ${sportsMarkets.length} sports markets out of ${allMarkets.length} total`);

  const newPosts = [];

  for (const market of sportsMarkets) {
    const marketId = market.id;
    const currentPrice = parseFloat(market.outcomePrices?.[0] || market.lastTradePrice || 0.5);
    const volume = parseFloat(market.volume || 0);
    const volume24h = parseFloat(market.volume24hr || market.volumeNum || 0);

    const cached = marketCache[marketId];

    // Check for significant price movement (>3% change)
    if (cached) {
      const priceChange = Math.abs(currentPrice - cached.price);
      const volumeChange = volume24h - cached.volume24h;

      if (priceChange > 0.03 || volumeChange > 50000) {
        const post = generateSagePost({
          question: market.question,
          currentPrice,
          previousPrice: cached.price,
          volume: volume24h,
          volumeChange,
          slug: market.slug
        });

        if (post) {
          newPosts.push({
            id: postIdCounter++,
            timestamp: 'just now',
            content: post.content,
            market: post.market,
            category: post.category,
            event: post.event,
            isLive: true,
            polymarketUrl: `https://polymarket.com/event/${market.slug}`,
            likes: Math.floor(Math.random() * 200) + 50,
            comments: []
          });
        }
      }
    }

    // Update cache
    marketCache[marketId] = {
      price: currentPrice,
      volume,
      volume24h,
      question: market.question,
      updatedAt: Date.now()
    };
  }

  // Add new posts to the front
  if (newPosts.length > 0) {
    generatedPosts = [...newPosts, ...generatedPosts].slice(0, 50);
    console.log(`Generated ${newPosts.length} new posts`);
  }

  return sportsMarkets;
}

// Generate initial posts from current market state
async function generateInitialPosts() {
  const allMarkets = await fetchPolymarkets();
  const sportsMarkets = filterSportsMarkets(allMarkets);

  console.log(`Generating initial posts from ${sportsMarkets.length} sports markets...`);

  // Sort by volume to get most active markets
  const sortedMarkets = sportsMarkets
    .filter(m => m.volume > 10000)
    .sort((a, b) => (b.volume || 0) - (a.volume || 0))
    .slice(0, 10);

  for (const market of sortedMarkets) {
    const currentPrice = parseFloat(market.outcomePrices?.[0] || market.lastTradePrice || 0.5);
    const volume = parseFloat(market.volume || 0);

    const post = generateSagePost({
      question: market.question,
      currentPrice,
      previousPrice: currentPrice - (Math.random() * 0.1 - 0.05), // Simulate recent change
      volume,
      volumeChange: volume * 0.1,
      slug: market.slug,
      isInitial: true
    });

    if (post) {
      const timeAgo = ['12m ago', '34m ago', '1h ago', '2h ago', '3h ago', '4h ago'][generatedPosts.length] || '5h ago';
      generatedPosts.push({
        id: postIdCounter++,
        timestamp: timeAgo,
        content: post.content,
        market: post.market,
        category: post.category,
        event: post.event,
        isLive: generatedPosts.length < 3,
        polymarketUrl: `https://polymarket.com/event/${market.slug}`,
        likes: Math.floor(Math.random() * 500) + 100,
        comments: []
      });
    }

    // Update cache
    marketCache[market.id] = {
      price: currentPrice,
      volume,
      volume24h: parseFloat(market.volume24hr || 0),
      question: market.question,
      updatedAt: Date.now()
    };
  }

  console.log(`Generated ${generatedPosts.length} initial posts`);
}

// API Routes

// Get all posts
app.get('/api/posts', (req, res) => {
  res.json({
    posts: generatedPosts,
    agent: SAGE_PROFILE,
    lastUpdated: new Date().toISOString()
  });
});

// Get raw market data
app.get('/api/markets', async (req, res) => {
  const markets = await fetchPolymarkets();
  const sportsMarkets = filterSportsMarkets(markets);
  res.json({
    total: markets.length,
    sports: sportsMarkets.length,
    markets: sportsMarkets.slice(0, 20)
  });
});

// Get agent profile
app.get('/api/agent', (req, res) => {
  res.json(SAGE_PROFILE);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    postsCount: generatedPosts.length,
    marketsTracked: Object.keys(marketCache).length
  });
});

// Start server and polling
async function start() {
  // Generate initial posts
  await generateInitialPosts();

  // Poll for updates every 30 seconds
  setInterval(async () => {
    console.log('Polling Polymarket for updates...');
    await processMarkets();
  }, 30000);

  app.listen(PORT, () => {
    console.log(`\n🐝 Hive server running at http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`   GET /api/posts   - Sage's posts`);
    console.log(`   GET /api/markets - Raw market data`);
    console.log(`   GET /api/health  - Server status\n`);
  });
}

start();
