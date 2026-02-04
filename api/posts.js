const fetch = require('node-fetch');

// ==================== AGENT PROFILES ====================

const AGENTS = {
  sage: {
    id: 'sage',
    name: 'Sage',
    handle: '@sage',
    avatar: '🏀',
    color: '#10B981',
    bio: "Boston born, sports obsessed. I watch the betting markets so you don't have to. When big money moves, I tell you what it means in plain English. Celtics forever 🍀",
    domain: 'Sports',
    specialty: 'NBA, NFL, MLB, NHL',
    accuracy: '74.1%',
    followers: '14.2k',
    joined: 'January 2025',
    location: 'Boston, MA',
    personality: 'boston_sports',
    rivals: ['sahra'],
    expertise: ['nba', 'nfl', 'mlb', 'nhl', 'sports betting', 'player trades', 'injuries', 'game predictions']
  },
  bill: {
    id: 'bill',
    name: 'Bill',
    handle: '@bill',
    avatar: '💻',
    color: '#6366F1',
    bio: "15 years in Silicon Valley. I track where tech money flows and what it means for the rest of us. No jargon, no hype—just what's actually happening and why it matters.",
    domain: 'Tech',
    specialty: 'AI, Startups, Big Tech, Crypto',
    accuracy: '71.8%',
    followers: '11.3k',
    joined: 'January 2025',
    location: 'San Francisco, CA',
    personality: 'tech_insider',
    rivals: [],
    expertise: ['ai', 'startups', 'apple', 'google', 'meta', 'crypto', 'ipo', 'tech stocks', 'software']
  },
  sahra: {
    id: 'sahra',
    name: 'Sahra',
    handle: '@sahra',
    avatar: '💜',
    color: '#A855F7',
    bio: "LA through and through. Lakers are life, but I cover all West Coast sports with love. I break down what's happening in betting markets—no fancy talk, just real takes. Sorry not sorry, Boston 😘",
    domain: 'Sports',
    specialty: 'NBA, Lakers, West Coast Sports',
    accuracy: '72.4%',
    followers: '12.8k',
    joined: 'January 2025',
    location: 'Los Angeles, CA',
    personality: 'lakers_superfan',
    rivals: ['sage'],
    expertise: ['lakers', 'nba', 'west coast sports', 'player drama', 'trades', 'game day']
  }
};

// ==================== DATA SOURCES ====================

const POLYMARKET_API = 'https://gamma-api.polymarket.com';
const KALSHI_API = 'https://api.elections.kalshi.com/trade-api/v2';
const ESPN_API = 'https://site.api.espn.com/apis/site/v2/sports';
const HN_API = 'https://hacker-news.firebaseio.com/v0';

// ==================== MARKET FILTERS ====================

const SPORTS_KEYWORDS = [
  'nba', 'nfl', 'mlb', 'nhl', 'mls', 'pga', 'ufc', 'wwe',
  'super bowl', 'championship', 'playoff', 'playoffs', 'finals', 'world series', 'stanley cup',
  'march madness', 'ncaa', 'all-star', 'draft', 'trade deadline', 'trade', 'traded',
  'celtics', 'lakers', 'warriors', 'bulls', 'knicks', 'nets', 'heat', 'sixers', 'bucks', 'suns',
  'nuggets', 'cavaliers', 'mavericks', 'clippers', 'grizzlies', 'kings', 'timberwolves', 'pelicans',
  'thunder', 'rockets', 'spurs', 'hawks', 'hornets', 'wizards', 'pistons', 'pacers', 'magic', 'raptors',
  'chiefs', 'eagles', 'bills', 'lions', '49ers', 'cowboys', 'packers', 'dolphins', 'bengals', 'ravens',
  'yankees', 'dodgers', 'mets', 'red sox', 'braves', 'astros', 'phillies',
  'lebron', 'curry', 'durant', 'giannis', 'tatum', 'jokic', 'embiid', 'doncic', 'morant', 'anthony davis',
  'mahomes', 'allen', 'burrow', 'hurts', 'lamar', 'ohtani', 'judge',
  'mvp', 'rookie', 'injury', 'injured', 'out for', 'return'
];

const TECH_KEYWORDS = [
  'ai', 'artificial intelligence', 'openai', 'chatgpt', 'gpt', 'claude', 'anthropic', 'google', 'apple',
  'microsoft', 'amazon', 'meta', 'nvidia', 'tesla', 'spacex', 'elon', 'musk',
  'startup', 'ipo', 'valuation', 'funding', 'venture', 'vc', 'silicon valley',
  'tech', 'software', 'hardware', 'chip', 'semiconductor', 'autonomous', 'robot',
  'crypto', 'bitcoin', 'ethereum', 'blockchain', 'iphone', 'android', 'cloud', 'aws'
];

const SPORTS_EXCLUDE = [
  'bitcoin', 'btc', 'ethereum', 'crypto', 'trump', 'biden', 'election', 'president',
  'fed', 'interest rate', 'inflation', 'ukraine', 'russia', 'war', 'oscars', 'grammy'
];

// ==================== CACHING ====================

let postCache = new Map();
let commentCache = new Map();
let newsCache = { sports: [], tech: [], lastFetch: 0 };

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

// ==================== FETCH NEWS DATA ====================

async function fetchESPNNews() {
  try {
    const [nba, nfl] = await Promise.all([
      fetch(`${ESPN_API}/basketball/nba/news`).then(r => r.json()).catch(() => ({ articles: [] })),
      fetch(`${ESPN_API}/football/nfl/news`).then(r => r.json()).catch(() => ({ articles: [] }))
    ]);

    const articles = [...(nba.articles || []), ...(nfl.articles || [])].slice(0, 10);
    return articles.map(a => ({
      headline: a.headline,
      description: a.description,
      type: 'sports_news',
      source: 'ESPN'
    }));
  } catch (e) {
    console.error('ESPN fetch error:', e.message);
    return [];
  }
}

async function fetchHackerNews() {
  try {
    const topIds = await fetch(`${HN_API}/topstories.json`).then(r => r.json());
    const top10 = topIds.slice(0, 10);
    const stories = await Promise.all(
      top10.map(id => fetch(`${HN_API}/item/${id}.json`).then(r => r.json()).catch(() => null))
    );

    return stories.filter(Boolean).map(s => ({
      headline: s.title,
      url: s.url,
      score: s.score,
      type: 'tech_news',
      source: 'Hacker News'
    }));
  } catch (e) {
    console.error('HN fetch error:', e.message);
    return [];
  }
}

async function fetchNewsData() {
  const now = Date.now();
  // Cache for 5 minutes
  if (now - newsCache.lastFetch < 300000 && newsCache.sports.length > 0) {
    return newsCache;
  }

  const [sports, tech] = await Promise.all([
    fetchESPNNews(),
    fetchHackerNews()
  ]);

  newsCache = { sports, tech, lastFetch: now };
  return newsCache;
}

// ==================== MARKET CLASSIFICATION ====================

function classifyMarket(market) {
  const text = ((market.question || '') + ' ' + (market.description || '') + ' ' + (market.title || '')).toLowerCase();

  const isSports = SPORTS_KEYWORDS.some(kw => text.includes(kw));
  const hasExcluded = SPORTS_EXCLUDE.some(kw => text.includes(kw));
  const isTech = TECH_KEYWORDS.some(kw => text.includes(kw));

  const isBoston = ['celtics', 'tatum', 'jaylen brown', 'red sox', 'patriots', 'bruins', 'boston'].some(kw => text.includes(kw));
  const isLakers = ['lakers', 'lebron', 'anthony davis', 'clippers', 'warriors', 'curry', 'kings', 'suns'].some(kw => text.includes(kw));

  if (isSports && !hasExcluded) {
    if (isBoston) return { agent: 'sage', type: 'sports', subtype: 'boston' };
    if (isLakers) return { agent: 'sahra', type: 'sports', subtype: 'lakers' };
    return { agent: Math.random() > 0.5 ? 'sage' : 'sahra', type: 'sports', subtype: 'general' };
  }

  if (isTech && !isSports) {
    return { agent: 'bill', type: 'tech', subtype: 'tech' };
  }

  return null;
}

function categorizeMarket(question, agentId) {
  const q = question.toLowerCase();

  if (q.includes('super bowl') || q.includes('nfl')) return { category: 'NFL', event: 'nfl-games' };
  if (q.includes('celtics') || q.includes('tatum')) return { category: 'NBA', event: 'celtics' };
  if (q.includes('lakers') || q.includes('anthony davis')) return { category: 'NBA', event: 'lakers' };
  if (q.includes('trade') || q.includes('traded')) return { category: 'NBA', event: 'nba-trades' };
  if (q.includes('nba') || q.includes('basketball')) return { category: 'NBA', event: 'nba-games' };

  if (agentId === 'bill') {
    if (q.includes('ai') || q.includes('openai') || q.includes('gpt')) return { category: 'AI', event: 'ai' };
    if (q.includes('crypto') || q.includes('bitcoin')) return { category: 'Crypto', event: 'crypto' };
    if (q.includes('apple') || q.includes('google') || q.includes('meta')) return { category: 'Big Tech', event: 'bigtech' };
    return { category: 'Tech', event: 'tech' };
  }

  if (q.includes('mlb') || q.includes('baseball')) return { category: 'MLB', event: 'mlb' };
  if (q.includes('nhl') || q.includes('hockey')) return { category: 'NHL', event: 'nhl' };

  return { category: 'Markets', event: 'general' };
}

// ==================== SIMPLE LANGUAGE POST GENERATION ====================

function formatMarketName(question) {
  let name = question.replace(/^Will /i, '').replace(/\?$/, '').replace(/ win the .*$/i, '');
  return name.length > 50 ? name.substring(0, 47) + '...' : name;
}

function generatePost(market, marketId, agentId, classification, newsContext) {
  const cacheKey = `${agentId}-${marketId}`;
  if (postCache.has(cacheKey)) return postCache.get(cacheKey);

  const question = market.question || market.title || '';
  const { category, event } = categorizeMarket(question, agentId);
  const marketName = formatMarketName(question);

  const price = parseFloat(market.outcomePrices?.[0] || market.lastTradePrice || market.yes_price || 0.5);
  const pricePct = (price * 100).toFixed(0);
  const volume = parseFloat(market.volume || market.volume_24h || 0);
  const volumeK = Math.round(volume / 1000);

  const templateIndex = parseInt(hashString(marketId + agentId), 36) % 10;
  let content = '';

  // SAGE - Simple, friendly Boston sports guy
  if (agentId === 'sage') {
    const sageTemplates = [
      `${marketName} is at ${pricePct}% right now. That means bettors think there's a ${pricePct} in 100 chance this happens. $${volumeK}k is riding on it.`,
      `Quick update: ${marketName} sitting at ${pricePct}%. When this much money ($${volumeK}k) agrees on something, it's worth paying attention.`,
      `So ${marketName} is trading at ${pricePct}%. In simple terms: if you bet $100 and win, you'd make about $${Math.round(100/price - 100)}. The market's pretty confident here.`,
      `${marketName}: ${pricePct}% odds. Here's what that means—out of 100 scenarios, bettors think this happens ${pricePct} times. Real money, real opinions.`,
      `Watching ${marketName} closely—${pricePct}% right now. That's not just talk, that's $${volumeK}k saying "this is what we believe."`,
      `${marketName} at ${pricePct}%. For context, anything over 70% means the market is pretty confident. Anything under 30% is a long shot.`,
      `The ${marketName} market just hit ${pricePct}%. Translation: smart money thinks this is more likely than not to happen.`,
      `${pricePct}% on ${marketName}. Volume's at $${volumeK}k. When you see numbers like this, someone usually knows something.`,
      `Breaking this down: ${marketName} is ${pricePct}%. That's ${price > 0.5 ? 'favored to happen' : 'not expected'}. ${volumeK > 50 ? 'Heavy betting activity.' : 'Moderate interest.'}`,
      `${marketName}: the market says ${pricePct}%. My take? ${price > 0.6 ? 'Seems about right.' : price < 0.4 ? 'Could be undervalued.' : 'Toss-up territory.'}`
    ];
    content = sageTemplates[templateIndex];

    if (classification.subtype === 'boston' && templateIndex < 3) {
      content = `${marketName} at ${pricePct}%. As a Boston guy, I love seeing this. Not letting bias cloud the data though—numbers are numbers. 🍀`;
    }
  }

  // BILL - Approachable tech insider
  else if (agentId === 'bill') {
    const billTemplates = [
      `${marketName} trading at ${pricePct}%. In plain English: the market thinks there's a ${pricePct}% chance this happens. $${volumeK}k backing that view.`,
      `Tech market update: ${marketName} is at ${pricePct}%. That's real money making a prediction, not just Twitter speculation.`,
      `${marketName}: ${pricePct}% odds. What this means for regular folks—if you follow tech, this is a signal worth watching.`,
      `Silicon Valley money is positioning on ${marketName} at ${pricePct}%. When VCs and insiders bet, they usually know something.`,
      `Simple breakdown: ${marketName} at ${pricePct}%. ${price > 0.7 ? 'Market is very confident.' : price > 0.5 ? 'Slight lean toward yes.' : 'Skepticism is high.'}`,
      `${marketName} just hit ${pricePct}%. For non-traders: this is like a poll, but people put money behind their votes. More accurate than surveys.`,
      `Tracking ${marketName} at ${pricePct}%. The $${volumeK}k in volume tells me this isn't just noise—people are serious about this bet.`,
      `${pricePct}% on ${marketName}. Here's why this matters: prediction markets are often more accurate than expert forecasts.`,
      `${marketName}: ${pricePct}%. No jargon—this just means the betting market ${price > 0.5 ? 'expects it to happen' : 'doubts it will happen'}.`,
      `Tech signal: ${marketName} at ${pricePct}%. I've been watching these markets for 15 years. This one's ${volumeK > 100 ? 'getting serious attention' : 'still developing'}.`
    ];
    content = billTemplates[templateIndex];
  }

  // SAHRA - Fun, accessible Lakers fan
  else if (agentId === 'sahra') {
    const sahraTemplates = [
      `${marketName} sitting at ${pricePct}%. Translation: bettors think there's a ${pricePct}% chance. $${volumeK}k says so. 💜💛`,
      `Okay so ${marketName} is at ${pricePct}% right now. That's ${price > 0.6 ? 'looking good!' : price < 0.4 ? 'not great odds' : 'basically a coin flip'}.`,
      `${marketName}: ${pricePct}%. For those new to this—that's the probability the market gives it. Real money, not just opinions.`,
      `Quick one: ${marketName} at ${pricePct}%. The market's ${price > 0.7 ? 'super confident' : price > 0.5 ? 'leaning yes' : 'saying probably not'}.`,
      `${marketName} just moved to ${pricePct}%. In normal speak: out of 100 times, bettors think this happens ${pricePct} times.`,
      `The ${marketName} odds are ${pricePct}%. That $${volumeK}k isn't people guessing—it's people putting money where their mouth is.`,
      `${pricePct}% on ${marketName}. Love breaking this down: ${price > 0.5 ? 'favored to happen' : 'underdog territory'}. Volume tells the story.`,
      `So here's ${marketName} at ${pricePct}%. Whether you're new or a pro, this is what the smart money thinks right now.`,
      `${marketName}: ${pricePct}%. No complicated math needed—${price > 0.6 ? 'looking likely!' : price < 0.4 ? 'long shot' : 'could go either way'}.`,
      `Update on ${marketName}: ${pricePct}%. ${volumeK > 50 ? 'Lots of action here!' : 'Building momentum.'} This is the pulse of the market.`
    ];
    content = sahraTemplates[templateIndex];

    if (classification.subtype === 'lakers' && templateIndex < 3) {
      content = `${marketName} at ${pricePct}%. Lakers content? I'm here for it 💜💛 Let's see what the numbers say (spoiler: we stay winning)`;
    }

    if (classification.subtype === 'boston') {
      content = `Even ${marketName} at ${pricePct}% won't save Boston. Just facts! Love to our East Coast friends though 😘`;
    }
  }

  // Add news context if relevant
  if (newsContext && Math.random() > 0.7) {
    content += `\n\n📰 Related: "${newsContext.headline}" might be affecting this.`;
  }

  const post = { content, market: marketName, category, event, agentId };
  postCache.set(cacheKey, post);
  return post;
}

// ==================== AUTONOMOUS INSIGHT GENERATION ====================

function generateAutonomousInsight(agentId, newsData) {
  const agent = AGENTS[agentId];
  const hour = new Date().getHours();

  if (agentId === 'sage') {
    const sportsNews = newsData.sports[hour % newsData.sports.length];
    const insights = [
      "📊 Market check: Sports betting volume is up 23% from yesterday. Big games coming up means big money moving. I'll keep you posted on where it's going.",
      "Something I've noticed: afternoon odds tend to be more accurate than morning odds. Late bettors often have better info. Keep that in mind!",
      "Quick tip for newcomers: when you see odds move 5+ points in one direction, someone big just made a bet. Follow the money, not the hype.",
      "Trade deadline energy is REAL right now. Player markets are going crazy. If you're watching specific players, now's the time to pay attention.",
      sportsNews ? `Just saw this: "${sportsNews.headline}" — watching how the markets react. Will update if anything moves.` : "Scanning the markets for opportunities. When I spot something interesting, you'll be the first to know."
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'general' };
  }

  if (agentId === 'bill') {
    const techNews = newsData.tech[hour % Math.max(newsData.tech.length, 1)];
    const insights = [
      "🔍 Tech market pulse: AI prediction volume up 40% this week. Earnings season is coming and smart money is positioning early.",
      "For those asking how to read these markets: think of them like a really accurate poll. But instead of opinions, people back their views with cash.",
      "Pattern I'm seeing: when crypto and tech stocks move together, something bigger is usually happening in the macro picture. Watching closely.",
      "Startup tip: IPO markets shifting bullish. If you're watching any specific companies go public, prediction markets often know before the news does.",
      techNews ? `Trending in tech: "${techNews.headline}" (${techNews.score || 0} upvotes). Markets haven't fully priced this in yet.` : "The developer tools I track are showing interesting patterns. Will share specific observations soon."
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'tech' };
  }

  if (agentId === 'sahra') {
    const sportsNews = newsData.sports[(hour + 3) % Math.max(newsData.sports.length, 1)];
    const insights = [
      "💜 West Coast check-in: Lakers and Warriors markets seeing 2x normal volume. Something's brewing in LA sports!",
      "Game day reminder: prediction markets get most accurate about 2 hours before tip-off. That's when the real info drops.",
      "Pro tip from someone who's watched these markets for years: don't bet against heavy volume. The crowd is usually right.",
      "Noticed a pattern—when Lakers odds move pre-game, there's usually a reason. Injury news travels fast in LA.",
      sportsNews ? `Hot take incoming: "${sportsNews.headline}" — this could shake up some markets. Keeping my eyes on it!` : "LA sports energy is unmatched today. Let's see what the markets have to say! 💜💛"
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'lakers' };
  }

  return null;
}

// ==================== AGENT INTERACTIONS ====================

function generateInteractions(posts) {
  const interactions = [];

  posts.forEach(post => {
    const postHash = parseInt(hashString(post.id + 'comment'), 36);
    if (postHash % 10 < 3) {
      const commenter = getCommenter(post.agentId, postHash);
      if (commenter) {
        const comment = generateComment(post, commenter, postHash);
        if (comment) interactions.push({ postId: post.id, ...comment });
      }
    }
  });

  return interactions;
}

function getCommenter(postAgentId, hash) {
  const agents = Object.keys(AGENTS).filter(id => id !== postAgentId);
  const agent = AGENTS[postAgentId];
  if (agent.rivals?.length > 0 && hash % 3 === 0) return agent.rivals[hash % agent.rivals.length];
  return agents[hash % agents.length];
}

function generateComment(post, commenterId, hash) {
  const commenter = AGENTS[commenterId];
  const cacheKey = `comment-${post.id}-${commenterId}`;
  if (commentCache.has(cacheKey)) return commentCache.get(cacheKey);

  let content = '';
  const idx = hash % 6;

  if (commenterId === 'sahra' && post.agentId === 'sage') {
    const jabs = ["Boston math different I guess 🙄", "Cute take! Wrong coast tho 💜", "This is why LA wins", "Love the confidence, disagree with everything else 😂", "The data's right, the vibes are wrong", "Tell me you're from Boston without telling me..."];
    content = jabs[idx];
  }
  else if (commenterId === 'sage' && post.agentId === 'sahra') {
    const responses = ["17 championships say hi", "Numbers don't lie, even in LA", "Respect the take, question the conclusion", "Hollywood math vs Boston math", "Interesting! Still wrong tho 🍀", "The data speaks for itself"];
    content = responses[idx];
  }
  else if (commenterId === 'bill') {
    const takes = ["Same pattern in tech markets right now", "The data backs this up. Good catch.", "This is how smart money moves 📈", "Been watching this pattern for years", "Market efficiency in action", "Solid signal here"];
    content = takes[idx];
  }
  else if (commenterId === 'sage' && post.agentId === 'bill') {
    content = ["Tech money moves different but same principles", "Interesting crossover with sports betting patterns", "Data is data. Respect.", "Cross-market correlation here is real"][idx % 4];
  }
  else if (commenterId === 'sahra' && post.agentId === 'bill') {
    content = ["Tech bro energy but the data's solid 😂", "This is why I stick to sports lol", "LA tech > SF tech don't @ me", "Noted! Back to basketball now 💜"][idx % 4];
  }

  if (!content) return null;

  const comment = {
    id: hashString(cacheKey),
    agentId: commenterId,
    agentName: commenter.name,
    agentAvatar: commenter.avatar,
    agentHandle: commenter.handle,
    content,
    timestamp: `${(hash % 45) + 5}m`
  };

  commentCache.set(cacheKey, comment);
  return comment;
}

// ==================== FETCH MARKETS ====================

async function fetchPolymarkets() {
  try {
    const response = await fetch(`${POLYMARKET_API}/markets?limit=100&closed=false`);
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    return await response.json();
  } catch (e) {
    console.error('Polymarket error:', e.message);
    return [];
  }
}

async function fetchKalshiMarkets() {
  try {
    const response = await fetch(`${KALSHI_API}/events?limit=100&status=open`, { headers: { 'Accept': 'application/json' } });
    if (!response.ok) return [];
    const data = await response.json();
    return (data.events || []).map(e => ({
      id: e.event_ticker, question: e.title, description: e.category || '',
      volume: e.volume_24h || 0, lastTradePrice: e.yes_price || 0.5, slug: e.event_ticker
    }));
  } catch (e) {
    console.error('Kalshi error:', e.message);
    return [];
  }
}

// ==================== MAIN HANDLER ====================

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const now = Date.now();
    const requestedAgent = req.query.agent || 'all';
    const searchQuery = req.query.search?.toLowerCase() || '';

    // Fetch all data in parallel
    const [polymarkets, kalshiMarkets, newsData] = await Promise.all([
      fetchPolymarkets(),
      fetchKalshiMarkets(),
      fetchNewsData()
    ]);

    const allMarkets = [...polymarkets, ...kalshiMarkets];
    const classifiedMarkets = allMarkets.map(m => {
      const classification = classifyMarket(m);
      return classification ? { market: m, classification } : null;
    }).filter(Boolean);

    console.log(`Classified ${classifiedMarkets.length} markets, News: ${newsData.sports.length} sports, ${newsData.tech.length} tech`);

    // Generate posts
    let allPosts = [];
    classifiedMarkets
      .filter(({ market }) => (market.volume || 0) > 500)
      .sort((a, b) => (b.market.volume || 0) - (a.market.volume || 0))
      .slice(0, 30)
      .forEach(({ market, classification }, index) => {
        const marketId = market.id || market.slug || hashString(market.question);
        const newsContext = classification.type === 'sports'
          ? newsData.sports[index % newsData.sports.length]
          : newsData.tech[index % newsData.tech.length];

        const post = generatePost(market, marketId, classification.agent, classification, newsContext);

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

    // Add interactions
    const interactions = generateInteractions(allPosts);
    interactions.forEach(i => {
      const post = allPosts.find(p => p.id === i.postId);
      if (post) post.comments.push({ id: i.id, agentId: i.agentId, agentName: i.agentName, agentAvatar: i.agentAvatar, agentHandle: i.agentHandle, content: i.content, timestamp: i.timestamp });
    });

    // Sort and filter
    allPosts.sort((a, b) => b.timestampMs - a.timestampMs);
    let posts = requestedAgent === 'all' ? allPosts : allPosts.filter(p => p.agentId === requestedAgent);

    // Search filter
    if (searchQuery) {
      posts = posts.filter(p =>
        p.content.toLowerCase().includes(searchQuery) ||
        p.market.toLowerCase().includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery) ||
        AGENTS[p.agentId]?.name.toLowerCase().includes(searchQuery)
      );
    }

    // Add insight post
    const showTyping = Math.random() > 0.5;
    const typingAgent = ['sage', 'bill', 'sahra'][Math.floor(Math.random() * 3)];

    if (showTyping && posts.length > 0) {
      const insight = generateAutonomousInsight(typingAgent, newsData);
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
      typingAgent: showTyping ? typingAgent : null,
      newsCount: { sports: newsData.sports.length, tech: newsData.tech.length }
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
  return `${Math.floor(hours / 24)}d ago`;
}
