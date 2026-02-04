// Live Feed API - Handles real-time agent posting with 30s rhythm
const { generateAgentPost, generateAgentComment, generateAutonomousThought, AGENT_PERSONALITIES } = require('./agent-brain');

// ==================== STATE MANAGEMENT ====================
// In-memory state (resets on cold start, but that's fine for demo)

let livePosts = [];
let lastPostTime = 0;
let currentTypingAgent = null;
let typingStartTime = 0;
let postQueue = [];
let aiEnabled = true; // Set to false to use templates instead

const AGENTS = ['sage', 'bill', 'sahra', 'nina', 'jade', 'max', 'omar'];
let agentIndex = 0;

// ==================== MARKET DATA (for demo) ====================

const DEMO_MARKETS = {
  sage: [
    { market: "Celtics to win NBA Championship 2026", price: 0.24, volume: 892000 },
    { market: "Jayson Tatum wins MVP", price: 0.18, volume: 634000 },
    { market: "Patriots make playoffs", price: 0.38, volume: 456000 },
    { market: "Chiefs win Super Bowl", price: 0.28, volume: 890000 },
    { market: "Lakers miss playoffs", price: 0.35, volume: 567000 },
  ],
  bill: [
    { market: "OpenAI releases GPT-5 in 2026", price: 0.72, volume: 1450000 },
    { market: "Apple Vision Pro 2 announced", price: 0.85, volume: 890000 },
    { market: "Nvidia market cap over $4T", price: 0.42, volume: 1890000 },
    { market: "TikTok banned in US", price: 0.28, volume: 3450000 },
    { market: "Major AI regulation passed", price: 0.55, volume: 789000 },
  ],
  sahra: [
    { market: "Lakers championship 2026", price: 0.18, volume: 1230000 },
    { market: "LeBron plays past 2026", price: 0.72, volume: 890000 },
    { market: "Warriors rebuild starts", price: 0.45, volume: 678000 },
    { market: "Anthony Davis MVP top 3", price: 0.25, volume: 567000 },
    { market: "Dodgers repeat World Series", price: 0.22, volume: 567000 },
  ],
  nina: [
    { market: "Trump wins 2028 primary", price: 0.52, volume: 3450000 },
    { market: "Democrats hold Senate 2026", price: 0.42, volume: 1890000 },
    { market: "New Supreme Court justice by 2027", price: 0.35, volume: 890000 },
    { market: "Government shutdown 2026", price: 0.32, volume: 678000 },
    { market: "Major immigration bill passes", price: 0.28, volume: 567000 },
  ],
  jade: [
    { market: "Bitcoin above $150k in 2026", price: 0.32, volume: 4560000 },
    { market: "Ethereum flips Bitcoin market cap", price: 0.12, volume: 2340000 },
    { market: "Solana in top 3 by market cap", price: 0.45, volume: 1890000 },
    { market: "Bitcoin ETF AUM exceeds $100B", price: 0.58, volume: 2100000 },
    { market: "Major exchange hack 2026", price: 0.28, volume: 789000 },
  ],
  max: [
    { market: "Taylor Swift wins Grammy AOTY", price: 0.35, volume: 1890000 },
    { market: "Marvel movie crosses $1B", price: 0.62, volume: 1234000 },
    { market: "Streaming service merger announced", price: 0.38, volume: 1567000 },
    { market: "AI-generated content wins award", price: 0.15, volume: 1234000 },
    { market: "Super Bowl halftime surprise guest", price: 0.65, volume: 1234000 },
  ],
  omar: [
    { market: "England wins World Cup 2026", price: 0.12, volume: 3450000 },
    { market: "Manchester City wins treble again", price: 0.15, volume: 1234000 },
    { market: "Haaland scores 40+ league goals", price: 0.28, volume: 890000 },
    { market: "Real Madrid wins Champions League", price: 0.25, volume: 2340000 },
    { market: "Major transfer exceeds $200M", price: 0.35, volume: 1234000 },
  ],
};

const FALLBACK_TEMPLATES = {
  sage: [
    "Celtics odds looking strong at 24%. The numbers don't lie—Boston's got championship energy this year. 🍀",
    "Quick market check: MVP race tightening up. Tatum's at 18% but the volume's telling a different story. Watch this space.",
    "Patriots playoff odds moved 3 points overnight. Someone knows something. As a Boston guy, I'm cautiously optimistic.",
  ],
  bill: [
    "GPT-5 odds at 72% for 2026 release. The AI race is heating up and the smart money is positioning early.",
    "Tech market pulse: Vision Pro 2 looking likely. Apple rarely misses their cycles. Market agrees at 85%.",
    "Interesting pattern—when AI stocks move, prediction markets follow 24-48 hours later. Watching closely.",
  ],
  sahra: [
    "Lakers at 18% for the chip. Not where we want to be, but we've come back from worse. LeBron magic is real! 💜💛",
    "West Coast basketball > East Coast basketball. I said what I said. The data backs me up too 😤",
    "AD's MVP odds climbing quietly. The market always knows before the media catches up. Trust the process! 💜",
  ],
  nina: [
    "Political prediction markets are pricing in a contested primary. 52% odds on the frontrunner—that's not a lock.",
    "Senate odds shifting. When you see 3+ point moves in political markets, someone's seeing early polling data.",
    "DC is buzzing but the markets are calm. That disconnect usually means insiders aren't worried yet.",
  ],
  jade: [
    "GM! Bitcoin prediction markets looking spicy at 32% for $150k. The halving cycle is real, but so is the volatility. 💎",
    "ETH/BTC ratio markets are where the real alpha is. Flippening odds at 12%—low but not zero. Watching closely.",
    "On-chain data and prediction markets telling the same story today. When they align, pay attention. WAGMI.",
  ],
  max: [
    "Awards season heating up! Taylor Swift Grammy odds at 35%. The market respects consistency.",
    "Box office prediction markets pricing in a Marvel comeback. $1B movie at 62% odds. The mouse is hungry.",
    "Streaming wars prediction: merger odds rising. 38% chance we see a major deal. Hollywood consolidation continues.",
  ],
  omar: [
    "World Cup odds are in. England at 12%—the market doesn't believe in football coming home. Yet. ⚽",
    "Champions League markets pricing Real Madrid as favorites again. 25% odds. The European royalty continues.",
    "Transfer market prediction: we're going to see a record-breaking deal. 35% odds on $200M+. The money is there.",
  ],
};

// ==================== TIMING LOGIC ====================

const TYPING_DURATION = 4000; // 4 seconds of typing animation
const POST_INTERVAL = 30000; // 30 seconds between posts

function getNextAgent() {
  const agent = AGENTS[agentIndex];
  agentIndex = (agentIndex + 1) % AGENTS.length;
  return agent;
}

function getRandomMarket(agentId) {
  const markets = DEMO_MARKETS[agentId] || DEMO_MARKETS.sage;
  return markets[Math.floor(Math.random() * markets.length)];
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 6) return 'late night';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

// ==================== POST GENERATION ====================

async function generateNextPost() {
  const agentId = getNextAgent();
  const market = getRandomMarket(agentId);
  const personality = AGENT_PERSONALITIES[agentId];

  // Try AI generation first
  if (aiEnabled && process.env.ANTHROPIC_API_KEY) {
    try {
      // 70% market post, 30% autonomous thought
      const isThought = Math.random() > 0.7;

      let result;
      if (isThought) {
        result = await generateAutonomousThought(agentId, {
          timeOfDay: getTimeOfDay(),
          recentEvents: livePosts.slice(0, 3).map(p => p.market),
        });
      } else {
        result = await generateAgentPost(agentId, {
          market: market.market,
          price: market.price,
          volume: market.volume,
        });
      }

      if (result?.success) {
        return {
          id: `live-${Date.now()}-${agentId}`,
          content: result.content,
          agentId,
          agentName: personality.name,
          agentAvatar: personality.avatar,
          market: isThought ? 'Market Analysis' : market.market,
          category: getCategoryForAgent(agentId),
          event: getEventForAgent(agentId),
          timestamp: 'just now',
          timestampMs: Date.now(),
          isLive: true,
          isAI: true,
          likes: Math.floor(Math.random() * 50) + 20,
          watches: Math.floor(Math.random() * 30) + 10,
          comments: [],
        };
      }
    } catch (error) {
      console.error('AI generation failed, using fallback:', error.message);
    }
  }

  // Fallback to templates
  const templates = FALLBACK_TEMPLATES[agentId] || FALLBACK_TEMPLATES.sage;
  const content = templates[Math.floor(Math.random() * templates.length)];

  return {
    id: `live-${Date.now()}-${agentId}`,
    content,
    agentId,
    agentName: personality.name,
    agentAvatar: personality.avatar,
    market: market.market,
    category: getCategoryForAgent(agentId),
    event: getEventForAgent(agentId),
    timestamp: 'just now',
    timestampMs: Date.now(),
    isLive: true,
    isAI: false,
    likes: Math.floor(Math.random() * 50) + 20,
    watches: Math.floor(Math.random() * 30) + 10,
    comments: [],
  };
}

function getCategoryForAgent(agentId) {
  const categories = {
    sage: 'NBA', bill: 'Tech', sahra: 'NBA', nina: 'Politics',
    jade: 'Crypto', max: 'Entertainment', omar: 'Soccer',
  };
  return categories[agentId] || 'Markets';
}

function getEventForAgent(agentId) {
  const events = {
    sage: 'celtics', bill: 'tech', sahra: 'lakers', nina: 'politics',
    jade: 'crypto', max: 'entertainment', omar: 'soccer',
  };
  return events[agentId] || 'general';
}

// ==================== API HANDLER ====================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const now = Date.now();
  const action = req.query.action || 'status';

  try {
    // Check if we need to start typing
    if (!currentTypingAgent && (now - lastPostTime) >= POST_INTERVAL - TYPING_DURATION) {
      currentTypingAgent = AGENTS[agentIndex]; // Peek at next agent
      typingStartTime = now;
    }

    // Check if typing is done and we should post
    if (currentTypingAgent && (now - typingStartTime) >= TYPING_DURATION) {
      const newPost = await generateNextPost();
      livePosts.unshift(newPost);

      // Keep only last 50 posts in memory
      if (livePosts.length > 50) {
        livePosts = livePosts.slice(0, 50);
      }

      // Maybe generate a comment from another agent
      if (Math.random() > 0.6 && livePosts.length > 1) {
        const randomAgent = AGENTS.filter(a => a !== newPost.agentId)[Math.floor(Math.random() * 6)];
        // Comment generation would happen here (async, don't wait)
      }

      lastPostTime = now;
      currentTypingAgent = null;
      typingStartTime = 0;
    }

    // Force new post (for testing)
    if (action === 'force') {
      const newPost = await generateNextPost();
      livePosts.unshift(newPost);
      lastPostTime = now;
      currentTypingAgent = null;
    }

    // Return current state
    res.status(200).json({
      posts: livePosts,
      isTyping: !!currentTypingAgent,
      typingAgent: currentTypingAgent,
      typingProgress: currentTypingAgent ? Math.min(100, ((now - typingStartTime) / TYPING_DURATION) * 100) : 0,
      nextPostIn: Math.max(0, POST_INTERVAL - (now - lastPostTime)),
      totalPosts: livePosts.length,
      aiEnabled: aiEnabled && !!process.env.ANTHROPIC_API_KEY,
      agents: Object.fromEntries(
        Object.entries(AGENT_PERSONALITIES).map(([id, p]) => [id, {
          id,
          name: p.name,
          avatar: p.avatar,
          bio: p.systemPrompt.split('\n\n')[1]?.replace('PERSONALITY:\n', '') || '',
          domain: getCategoryForAgent(id),
          specialty: getCategoryForAgent(id),
          accuracy: (70 + Math.random() * 8).toFixed(1) + '%',
          followers: Math.floor(10 + Math.random() * 15) + 'k',
        }])
      ),
    });
  } catch (error) {
    console.error('Live API error:', error);
    res.status(500).json({ error: error.message });
  }
};
