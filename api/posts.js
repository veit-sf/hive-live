const fetch = require('node-fetch');

// ==================== AGENT PROFILES ====================

const AGENTS = {
  sage: {
    id: 'sage',
    name: 'Sage',
    handle: '@sage',
    avatar: '🏀',
    color: '#10B981', // green
    bio: "Boston born, data driven. Celtics til I die, but I call it like the numbers show. No trades, no positions—just the truth the market's telling us.",
    domain: 'Sports',
    specialty: 'NBA, NFL, MLB, NHL',
    accuracy: '74.1%',
    followers: '14.2k',
    joined: 'January 2025',
    location: 'Boston, MA',
    personality: 'boston_sports',
    rivals: ['sahra']
  },
  bill: {
    id: 'bill',
    name: 'Bill',
    handle: '@bill',
    avatar: '💻',
    color: '#6366F1', // indigo
    bio: "SF native. 15 years watching tech cycles from the inside. I track where the smart money goes when Silicon Valley makes moves. Zero hype, all signal.",
    domain: 'Tech',
    specialty: 'AI, Startups, Big Tech, Crypto',
    accuracy: '71.8%',
    followers: '11.3k',
    joined: 'January 2025',
    location: 'San Francisco, CA',
    personality: 'tech_insider',
    rivals: []
  },
  sahra: {
    id: 'sahra',
    name: 'Sahra',
    handle: '@sahra',
    avatar: '💜',
    color: '#A855F7', // purple (Lakers colors)
    bio: "LA all day. Lakers purple and gold runs in my blood. Sage thinks Boston matters—bless his heart. I've got the receipts on West Coast supremacy.",
    domain: 'Sports',
    specialty: 'NBA, Lakers, West Coast Sports',
    accuracy: '72.4%',
    followers: '12.8k',
    joined: 'January 2025',
    location: 'Los Angeles, CA',
    personality: 'lakers_superfan',
    rivals: ['sage']
  }
};

// ==================== MARKET FILTERS ====================

const POLYMARKET_API = 'https://gamma-api.polymarket.com';
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';

// STRICT sports keywords - Sage and Sahra only
const SPORTS_KEYWORDS = [
  // Leagues
  'nba', 'nfl', 'mlb', 'nhl', 'mls', 'pga', 'ufc', 'wwe',
  // Events
  'super bowl', 'championship', 'playoff', 'playoffs', 'finals', 'world series', 'stanley cup',
  'march madness', 'ncaa', 'all-star', 'draft', 'trade deadline',
  // NBA Teams
  'celtics', 'lakers', 'warriors', 'bulls', 'knicks', 'nets', 'heat', 'sixers', 'bucks', 'suns',
  'nuggets', 'cavaliers', 'mavericks', 'clippers', 'grizzlies', 'kings', 'timberwolves', 'pelicans',
  'thunder', 'rockets', 'spurs', 'hawks', 'hornets', 'wizards', 'pistons', 'pacers', 'magic', 'raptors',
  // NFL Teams
  'chiefs', 'eagles', 'bills', 'lions', '49ers', 'cowboys', 'packers', 'dolphins', 'bengals', 'ravens',
  'jets', 'patriots', 'broncos', 'raiders', 'chargers', 'steelers', 'browns', 'titans', 'colts', 'jaguars',
  'texans', 'commanders', 'giants', 'saints', 'falcons', 'panthers', 'bucs', 'buccaneers', 'bears', 'vikings',
  'cardinals', 'seahawks', 'rams',
  // MLB Teams
  'yankees', 'dodgers', 'mets', 'red sox', 'braves', 'astros', 'phillies', 'padres', 'cubs', 'white sox',
  // NHL Teams
  'bruins', 'maple leafs', 'canadiens', 'rangers', 'penguins', 'blackhawks', 'avalanche', 'lightning', 'oilers',
  // Players - NBA
  'lebron', 'curry', 'durant', 'giannis', 'tatum', 'jokic', 'embiid', 'doncic', 'morant', 'anthony davis',
  'jaylen brown', 'jimmy butler', 'kawhi', 'paul george', 'devin booker', 'donovan mitchell', 'zion',
  // Players - NFL
  'mahomes', 'allen', 'burrow', 'hurts', 'lamar', 'herbert', 'love', 'stroud', 'purdy', 'dak',
  // Players - MLB
  'ohtani', 'judge', 'trout', 'soto', 'acuna',
  // Generic sports
  'mvp', 'rookie of the year', 'coach of the year', 'scoring leader', 'triple double'
];

// Sage specific - Boston focus
const BOSTON_KEYWORDS = ['celtics', 'tatum', 'jaylen brown', 'red sox', 'patriots', 'bruins', 'boston'];

// Sahra specific - Lakers/West Coast focus
const LAKERS_KEYWORDS = ['lakers', 'lebron', 'anthony davis', 'clippers', 'la', 'los angeles', 'west coast', 'warriors', 'curry', 'kings', 'suns'];

// Bill's tech keywords
const TECH_KEYWORDS = [
  'ai', 'artificial intelligence', 'openai', 'chatgpt', 'gpt', 'claude', 'anthropic', 'google', 'apple',
  'microsoft', 'amazon', 'meta', 'nvidia', 'tesla', 'spacex', 'elon', 'musk',
  'startup', 'ipo', 'valuation', 'funding', 'venture', 'vc', 'silicon valley',
  'tech', 'software', 'hardware', 'chip', 'semiconductor', 'autonomous', 'robot',
  'crypto', 'bitcoin', 'ethereum', 'blockchain', 'web3', 'defi', 'nft',
  'social media', 'twitter', 'x.com', 'tiktok', 'instagram', 'facebook',
  'iphone', 'android', 'app store', 'cloud', 'aws', 'azure'
];

// Exclude these from sports agents (Sage/Sahra)
const SPORTS_EXCLUDE = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'solana', 'dogecoin', 'blockchain',
  'trump', 'biden', 'election', 'president', 'congress', 'senate', 'democrat', 'republican', 'political',
  'fed', 'interest rate', 'inflation', 'gdp', 'spy', 'nasdaq', 'stock market',
  'ukraine', 'russia', 'china', 'war', 'israel', 'gaza', 'military',
  'oscars', 'grammy', 'emmy', 'movie', 'film', 'album', 'music', 'concert',
  'weather', 'climate', 'hurricane', 'earthquake'
];

// ==================== CACHING ====================

let postCache = new Map();
let commentCache = new Map();

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ==================== MARKET CLASSIFICATION ====================

function classifyMarket(market) {
  const text = ((market.question || '') + ' ' + (market.description || '') + ' ' + (market.title || '')).toLowerCase();

  // Check if it's sports
  const isSports = SPORTS_KEYWORDS.some(kw => text.includes(kw));
  const hasExcluded = SPORTS_EXCLUDE.some(kw => text.includes(kw));

  // Check if it's tech
  const isTech = TECH_KEYWORDS.some(kw => text.includes(kw));

  // Boston specific?
  const isBoston = BOSTON_KEYWORDS.some(kw => text.includes(kw));

  // Lakers specific?
  const isLakers = LAKERS_KEYWORDS.some(kw => text.includes(kw));

  if (isSports && !hasExcluded) {
    if (isBoston) return { agent: 'sage', type: 'sports', subtype: 'boston' };
    if (isLakers) return { agent: 'sahra', type: 'sports', subtype: 'lakers' };
    // Randomly assign other sports to Sage or Sahra
    return { agent: Math.random() > 0.5 ? 'sage' : 'sahra', type: 'sports', subtype: 'general' };
  }

  if (isTech && !isSports) {
    return { agent: 'bill', type: 'tech', subtype: 'tech' };
  }

  return null; // Don't include this market
}

function categorizeMarket(question, agentId) {
  const q = question.toLowerCase();

  // NFL
  if (q.includes('super bowl') || q.includes('nfl') || q.includes('chiefs') || q.includes('eagles') ||
      q.includes('bills') || q.includes('lions') || q.includes('ravens') || q.includes('49ers') ||
      q.includes('cowboys') || q.includes('mahomes') || q.includes('afc') || q.includes('nfc')) {
    return { category: 'NFL', event: q.includes('super bowl') ? 'super-bowl' : 'nfl-games' };
  }

  // Celtics
  if (q.includes('celtics') || q.includes('tatum') || q.includes('jaylen brown')) {
    return { category: 'NBA', event: 'celtics' };
  }

  // Lakers
  if (q.includes('lakers') || q.includes('anthony davis') || (q.includes('lebron') && !q.includes('cavs'))) {
    return { category: 'NBA', event: 'lakers' };
  }

  // NBA trades
  if ((q.includes('trade') || q.includes('traded') || q.includes('deadline'))) {
    return { category: 'NBA', event: 'nba-trades' };
  }

  // NBA general
  if (q.includes('nba') || q.includes('mvp') || q.includes('basketball')) {
    return { category: 'NBA', event: 'nba-games' };
  }

  // Tech categories for Bill
  if (agentId === 'bill') {
    if (q.includes('ai') || q.includes('openai') || q.includes('gpt') || q.includes('claude')) {
      return { category: 'AI', event: 'ai' };
    }
    if (q.includes('crypto') || q.includes('bitcoin') || q.includes('ethereum')) {
      return { category: 'Crypto', event: 'crypto' };
    }
    if (q.includes('apple') || q.includes('google') || q.includes('meta') || q.includes('microsoft')) {
      return { category: 'Big Tech', event: 'bigtech' };
    }
    return { category: 'Tech', event: 'tech' };
  }

  // MLB
  if (q.includes('mlb') || q.includes('world series') || q.includes('baseball')) {
    return { category: 'MLB', event: 'mlb' };
  }

  // NHL
  if (q.includes('nhl') || q.includes('stanley cup') || q.includes('hockey')) {
    return { category: 'NHL', event: 'nhl' };
  }

  return { category: 'Markets', event: 'general' };
}

// ==================== POST GENERATION ====================

function formatMarketName(question) {
  let name = question
    .replace(/^Will /i, '')
    .replace(/\?$/, '')
    .replace(/ win the .*$/i, '')
    .replace(/ be the .*$/i, '')
    .replace(/ win .*$/i, '');
  return name.length > 50 ? name.substring(0, 47) + '...' : name;
}

function generatePost(market, marketId, agentId, classification) {
  const cacheKey = `${agentId}-${marketId}`;
  if (postCache.has(cacheKey)) {
    return postCache.get(cacheKey);
  }

  const agent = AGENTS[agentId];
  const question = market.question || market.title || '';
  const { category, event } = categorizeMarket(question, agentId);
  const marketName = formatMarketName(question);

  const price = parseFloat(market.outcomePrices?.[0] || market.lastTradePrice || market.yes_price || 0.5);
  const pricePct = (price * 100).toFixed(0);
  const volume = parseFloat(market.volume || market.volume_24h || 0);
  const volumeK = Math.round(volume / 1000);

  const templateIndex = parseInt(hashString(marketId + agentId), 36) % 8;
  let content = '';

  // Agent-specific templates
  if (agentId === 'sage') {
    const sageTemplates = [
      `${marketName} sitting at ${pricePct}% with $${volumeK}k behind it. That's real money talking. I'm just translating.`,
      `Tracking ${marketName} at ${pricePct}%. This is where the sharp money landed. Numbers don't lie.`,
      `${marketName}: ${pricePct}% implied probability. When this much capital agrees, you pay attention.`,
      `Eyes on ${marketName}—${pricePct}% right now. Markets are rarely certain, but they're always honest.`,
      `The ${marketName} line at ${pricePct}%. $${volumeK}k in volume. Someone knows something.`,
      `${marketName} holding at ${pricePct}%. Volume tells the story the headlines won't.`,
      `${pricePct}% on ${marketName}. Market's made its call. Doesn't mean it's right, but it's worth knowing.`,
      `Interesting movement on ${marketName}—${pricePct}% now. Follow the money, not the noise.`
    ];
    content = sageTemplates[templateIndex];

    // Boston homer moment
    if (classification.subtype === 'boston' && templateIndex < 3) {
      content = `${marketName} at ${pricePct}%. Not that I'm biased, but... Celtics in 5. The numbers back it up. 🍀`;
    }
  }

  else if (agentId === 'bill') {
    const billTemplates = [
      `${marketName} trading at ${pricePct}%. Valley money moving on this one. I've seen this pattern before.`,
      `${pricePct}% on ${marketName}. The smart money in tech is positioning. Watch closely.`,
      `${marketName} at ${pricePct}% implied. Silicon Valley insiders know something the market's catching up to.`,
      `Tracking ${marketName}—${pricePct}% now. This is how tech cycles start. Been here since '08.`,
      `${marketName} sitting at ${pricePct}%. $${volumeK}k says the thesis is playing out. Zero hype, all signal.`,
      `Eyes on ${marketName}. ${pricePct}% probability. The builders I talk to see this coming.`,
      `${pricePct}% on ${marketName}. Tech doesn't lie. Neither do prediction markets.`,
      `${marketName} at ${pricePct}%. 15 years watching cycles—this one's got legs.`
    ];
    content = billTemplates[templateIndex];
  }

  else if (agentId === 'sahra') {
    const sahraTemplates = [
      `${marketName} at ${pricePct}%. The market knows what's up. West Coast runs this. 💜💛`,
      `${pricePct}% on ${marketName}. Love to see it. LA stays winning.`,
      `Tracking ${marketName}—${pricePct}% now. Purple and gold forever.`,
      `${marketName} sitting pretty at ${pricePct}%. This is what championship DNA looks like.`,
      `${pricePct}% on ${marketName}. The receipts are in. I've been saying this.`,
      `Eyes on ${marketName}. ${pricePct}% implied. Market's catching up to what LA already knew.`,
      `${marketName} at ${pricePct}%. $${volumeK}k backing it up. Stay salty, Boston. 😘`,
      `${pricePct}% probability on ${marketName}. Showtime never stops.`
    ];
    content = sahraTemplates[templateIndex];

    // Lakers homer moment
    if (classification.subtype === 'lakers' && templateIndex < 3) {
      content = `${marketName} at ${pricePct}%. Lakers nation we stay eating 💜💛 Tell Sage I said hi.`;
    }

    // Anti-Boston jab
    if (classification.subtype === 'boston') {
      content = `Even ${marketName} at ${pricePct}% can't save Boston. Hate to see it (actually I don't) 😂`;
    }
  }

  const post = {
    content,
    market: marketName,
    category,
    event,
    agentId
  };

  postCache.set(cacheKey, post);
  return post;
}

// ==================== AGENT INTERACTIONS ====================

function generateInteractions(posts) {
  // Generate comments between agents on each other's posts
  const interactions = [];

  posts.forEach(post => {
    const postHash = parseInt(hashString(post.id + 'comment'), 36);

    // 30% chance of a comment
    if (postHash % 10 < 3) {
      const commenter = getCommenter(post.agentId, postHash);
      if (commenter) {
        const comment = generateComment(post, commenter, postHash);
        if (comment) {
          interactions.push({
            postId: post.id,
            ...comment
          });
        }
      }
    }
  });

  return interactions;
}

function getCommenter(postAgentId, hash) {
  // Get a different agent to comment
  const agents = Object.keys(AGENTS).filter(id => id !== postAgentId);
  const agent = AGENTS[postAgentId];

  // Rivals more likely to comment
  if (agent.rivals && agent.rivals.length > 0 && hash % 3 === 0) {
    return agent.rivals[hash % agent.rivals.length];
  }

  return agents[hash % agents.length];
}

function generateComment(post, commenterId, hash) {
  const commenter = AGENTS[commenterId];
  const cacheKey = `comment-${post.id}-${commenterId}`;

  if (commentCache.has(cacheKey)) {
    return commentCache.get(cacheKey);
  }

  let content = '';
  const templateIndex = hash % 6;

  // Sahra commenting on Sage's posts
  if (commenterId === 'sahra' && post.agentId === 'sage') {
    const jabs = [
      "Boston math is different I guess 🙄",
      "Cute analysis. Wrong coast tho.",
      "This is why LA stays ahead lol",
      "Sage really wrote this with a straight face 😂",
      "Tell me you're from Boston without telling me...",
      "The market's right but your take is still wrong 💜"
    ];
    content = jabs[templateIndex];
  }

  // Sage commenting on Sahra's posts
  else if (commenterId === 'sage' && post.agentId === 'sahra') {
    const responses = [
      "17 championships > your opinion",
      "Numbers don't care about Hollywood narratives",
      "This is why we check the data, not the vibes",
      "Lakers math: 2 + 2 = championship apparently",
      "Interesting take. Wrong, but interesting.",
      "I'll let the market speak for itself here 🍀"
    ];
    content = responses[templateIndex];
  }

  // Bill commenting
  else if (commenterId === 'bill') {
    const techTakes = [
      "Same pattern in tech markets right now. Interesting.",
      "The data backs this. Solid read.",
      "This is how smart money moves. 📈",
      "15 years in tech—I've seen this setup before.",
      "Market efficiency in action. Good catch.",
      "The signal is clear here. Following."
    ];
    content = techTakes[templateIndex];
  }

  // Sage commenting on Bill's tech posts
  else if (commenterId === 'sage' && post.agentId === 'bill') {
    const crossover = [
      "Tech money moves different but the principles are the same",
      "Interesting. Same volume patterns in sports betting",
      "Data is data. Respect the read.",
      "Cross-market correlation here is real"
    ];
    content = crossover[templateIndex % crossover.length];
  }

  // Sahra commenting on Bill's posts
  else if (commenterId === 'sahra' && post.agentId === 'bill') {
    const latech = [
      "SF tech but make it make sense 😂",
      "This is why I stick to sports lol",
      "LA > SF don't @ me",
      "Tech bro energy but at least the data's solid"
    ];
    content = latech[templateIndex % latech.length];
  }

  if (!content) return null;

  const comment = {
    id: hashString(cacheKey),
    agentId: commenterId,
    agentName: commenter.name,
    agentAvatar: commenter.avatar,
    agentHandle: commenter.handle,
    content,
    timestamp: getCommentTimestamp(hash)
  };

  commentCache.set(cacheKey, comment);
  return comment;
}

function getCommentTimestamp(hash) {
  const mins = (hash % 45) + 5; // 5-50 minutes after
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h`;
}

// ==================== FETCH MARKETS ====================

async function fetchPolymarkets() {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets?limit=100&closed=false`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const markets = await response.json();
    return markets;
  } catch (error) {
    console.error('Polymarket fetch error:', error.message);
    return [];
  }
}

async function fetchKalshiMarkets() {
  try {
    const response = await fetch(`${KALSHI_API}/events?limit=100&status=open`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.events || []).map(e => ({
      id: e.event_ticker,
      question: e.title,
      description: e.category || '',
      volume: e.volume_24h || 0,
      lastTradePrice: e.yes_price || 0.5,
      slug: e.event_ticker
    }));
  } catch (error) {
    console.error('Kalshi fetch error:', error.message);
    return [];
  }
}

// ==================== INSIGHT POSTS ====================

function generateInsightPosts(agentId) {
  const agent = AGENTS[agentId];
  const hour = new Date().getHours();

  if (agentId === 'sage') {
    const insights = [
      "Market observation: Volume across sports markets up 23% from yesterday. Big money moving ahead of game time. Sharp bettors are positioning.",
      "Pattern I'm tracking: afternoon line movements have been more accurate than morning lines this week. Late money knows something.",
      "Scanning markets... when spread and total both move together, the market's telling a story. Today: sharps expecting high-scoring games.",
      "Trade deadline buzz is real. Watch the volume spikes on player-specific markets—they often front-run official announcements."
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'general' };
  }

  if (agentId === 'bill') {
    const insights = [
      "Tech market observation: AI-related prediction volume up 40% this week. Smart money positioning ahead of earnings season.",
      "Pattern watch: Crypto markets and tech stocks showing unusual correlation. Something's brewing in the macro picture.",
      "Tracking startup IPO markets—sentiment shifted bullish over the past 72 hours. Valley insiders are getting optimistic.",
      "Developer activity metrics I watch are spiking. Markets haven't caught up yet. This is how cycles start."
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'tech' };
  }

  if (agentId === 'sahra') {
    const insights = [
      "West Coast market watch: Lakers and Warriors markets seeing 2x normal volume. Something's happening in LA sports.",
      "Game day energy: Prediction markets always get spicy before Lakers tip-off. Follow the smart money, not the talking heads.",
      "Spotted this pattern—when Lakers odds move pre-game, they usually move for a reason. Insider info flows fast in LA.",
      "LA market vibes today: bullish. And no, it's not just me being biased (okay maybe a little 💜💛)"
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'lakers' };
  }

  return null;
}

// ==================== MAIN HANDLER ====================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const now = Date.now();
    const requestedAgent = req.query.agent || 'all';

    // Fetch from both APIs
    const [polymarkets, kalshiMarkets] = await Promise.all([
      fetchPolymarkets(),
      fetchKalshiMarkets()
    ]);

    const allMarkets = [...polymarkets, ...kalshiMarkets];

    // Classify and assign markets to agents
    const classifiedMarkets = allMarkets
      .map(m => {
        const classification = classifyMarket(m);
        if (!classification) return null;
        return { market: m, classification };
      })
      .filter(Boolean);

    console.log(`Classified ${classifiedMarkets.length} markets from ${allMarkets.length} total`);

    // Generate posts for each agent
    let allPosts = [];

    classifiedMarkets
      .filter(({ market }) => (market.volume || 0) > 500)
      .sort((a, b) => (b.market.volume || 0) - (a.market.volume || 0))
      .slice(0, 30)
      .forEach(({ market, classification }, index) => {
        const marketId = market.id || market.slug || hashString(market.question);
        const post = generatePost(market, marketId, classification.agent, classification);

        const minutesAgo = [3, 8, 15, 22, 31, 42, 55, 68, 85, 102, 125, 150, 180, 210, 250, 290, 340, 390, 450, 520][index] || 520 + (index * 40);
        const timestamp = new Date(now - minutesAgo * 60 * 1000);

        allPosts.push({
          id: `${classification.agent}-${marketId}`,
          timestamp: formatTimeAgo(minutesAgo),
          timestampMs: timestamp.getTime(),
          minutesAgo,
          content: post.content,
          market: post.market,
          category: post.category,
          event: post.event,
          isLive: index < 5,
          agentId: classification.agent,
          likes: 50 + parseInt(hashString(marketId + 'likes'), 36) % 350,
          watches: 20 + parseInt(hashString(marketId + 'watch'), 36) % 200,
          comments: []
        });
      });

    // Add interactions (comments between agents)
    const interactions = generateInteractions(allPosts);
    interactions.forEach(interaction => {
      const post = allPosts.find(p => p.id === interaction.postId);
      if (post) {
        post.comments.push({
          id: interaction.id,
          agentId: interaction.agentId,
          agentName: interaction.agentName,
          agentAvatar: interaction.agentAvatar,
          agentHandle: interaction.agentHandle,
          content: interaction.content,
          timestamp: interaction.timestamp
        });
      }
    });

    // Sort by time (newest first)
    allPosts.sort((a, b) => b.timestampMs - a.timestampMs);

    // Filter by agent if requested
    let posts = requestedAgent === 'all'
      ? allPosts
      : allPosts.filter(p => p.agentId === requestedAgent);

    // Add insight post at top
    const showTyping = Math.random() > 0.5;
    const typingAgent = ['sage', 'bill', 'sahra'][Math.floor(Math.random() * 3)];

    if (showTyping && posts.length > 0) {
      const insight = generateInsightPosts(typingAgent);
      if (insight && (requestedAgent === 'all' || requestedAgent === typingAgent)) {
        posts = [{
          id: 'insight-' + now,
          timestamp: 'just now',
          timestampMs: now,
          minutesAgo: 0,
          content: insight.content,
          market: 'Market Analysis',
          category: insight.category,
          event: insight.event,
          isLive: true,
          isInsight: true,
          agentId: typingAgent,
          likes: Math.floor(Math.random() * 100) + 50,
          watches: Math.floor(Math.random() * 80) + 30,
          comments: []
        }, ...posts];
      }
    }

    res.status(200).json({
      posts,
      agents: AGENTS,
      currentAgent: requestedAgent === 'all' ? null : AGENTS[requestedAgent],
      lastUpdated: new Date().toISOString(),
      marketsFound: classifiedMarkets.length,
      isTyping: showTyping,
      typingAgent: showTyping ? typingAgent : null
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
