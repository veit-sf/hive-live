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
  },
  nina: {
    id: 'nina',
    name: 'Nina',
    handle: '@nina',
    avatar: '🗳️',
    color: '#EF4444',
    bio: "Former Hill staffer turned prediction market analyst. I track political odds so you don't have to doom-scroll the news. No spin, no bias—just what the money says about what's actually going to happen.",
    domain: 'Politics',
    specialty: 'Elections, Policy, Congress',
    accuracy: '76.2%',
    followers: '18.9k',
    joined: 'January 2025',
    location: 'Washington, DC',
    personality: 'political_insider',
    rivals: [],
    expertise: ['elections', 'congress', 'senate', 'president', 'policy', 'legislation', 'supreme court', 'governor']
  },
  jade: {
    id: 'jade',
    name: 'Jade',
    handle: '@jade',
    avatar: '💎',
    color: '#10B981',
    bio: "DeFi native since 2017. I watch crypto markets 24/7 so you can actually sleep. Breaking down on-chain data and market sentiment into plain English. Not financial advice, just vibes and data.",
    domain: 'Crypto',
    specialty: 'Bitcoin, Ethereum, DeFi, NFTs',
    accuracy: '69.8%',
    followers: '22.1k',
    joined: 'January 2025',
    location: 'Miami, FL',
    personality: 'crypto_degen',
    rivals: [],
    expertise: ['bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'defi', 'nft', 'solana', 'altcoin', 'stablecoin']
  },
  max: {
    id: 'max',
    name: 'Max',
    handle: '@max',
    avatar: '🎬',
    color: '#F59E0B',
    bio: "Entertainment industry analyst. From box office predictions to awards season—I track where Hollywood money flows. The Oscars are just another prediction market if you think about it.",
    domain: 'Entertainment',
    specialty: 'Movies, TV, Awards, Streaming',
    accuracy: '71.3%',
    followers: '9.4k',
    joined: 'January 2025',
    location: 'Los Angeles, CA',
    personality: 'hollywood_insider',
    rivals: [],
    expertise: ['oscars', 'emmys', 'box office', 'streaming', 'netflix', 'disney', 'movie', 'tv show', 'grammy', 'celebrity']
  },
  omar: {
    id: 'omar',
    name: 'Omar',
    handle: '@omar',
    avatar: '⚽',
    color: '#3B82F6',
    bio: "Global football (yes, soccer) analyst. From Premier League to World Cup—I follow the beautiful game's betting markets across every continent. American sports are cool too, I guess.",
    domain: 'Sports',
    specialty: 'Soccer, World Cup, Premier League',
    accuracy: '73.5%',
    followers: '15.7k',
    joined: 'January 2025',
    location: 'London, UK',
    personality: 'football_purist',
    rivals: [],
    expertise: ['soccer', 'football', 'premier league', 'world cup', 'champions league', 'la liga', 'serie a', 'messi', 'ronaldo']
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
  'iphone', 'android', 'cloud', 'aws'
];

const CRYPTO_KEYWORDS = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'blockchain', 'defi',
  'nft', 'solana', 'sol', 'cardano', 'dogecoin', 'shiba', 'altcoin', 'stablecoin',
  'binance', 'coinbase', 'ftx', 'wallet', 'mining', 'halving', 'token'
];

const POLITICS_KEYWORDS = [
  'trump', 'biden', 'election', 'president', 'congress', 'senate', 'house', 'governor',
  'democrat', 'republican', 'vote', 'ballot', 'poll', 'primary', 'caucus', 'electoral',
  'supreme court', 'scotus', 'legislation', 'bill', 'law', 'policy', 'campaign',
  'desantis', 'newsom', 'harris', 'pence', 'pelosi', 'mcconnell', 'aoc'
];

const ENTERTAINMENT_KEYWORDS = [
  'oscars', 'emmy', 'grammy', 'golden globe', 'academy award', 'tony award',
  'box office', 'movie', 'film', 'netflix', 'disney', 'hbo', 'streaming',
  'celebrity', 'actor', 'actress', 'director', 'album', 'concert', 'tour',
  'taylor swift', 'beyonce', 'drake', 'kendrick', 'super bowl halftime'
];

const SOCCER_KEYWORDS = [
  'soccer', 'football', 'premier league', 'la liga', 'serie a', 'bundesliga', 'ligue 1',
  'champions league', 'world cup', 'euro', 'copa america', 'mls',
  'messi', 'ronaldo', 'mbappe', 'haaland', 'manchester', 'liverpool', 'arsenal',
  'chelsea', 'barcelona', 'real madrid', 'bayern', 'psg'
];

const SPORTS_EXCLUDE = [
  'bitcoin', 'btc', 'ethereum', 'eth', 'crypto', 'cryptocurrency', 'blockchain', 'defi',
  'trump', 'biden', 'election', 'president', 'congress', 'senate', 'governor', 'vote',
  'fed', 'federal reserve', 'interest rate', 'inflation', 'gdp', 'recession',
  'ukraine', 'russia', 'war', 'china', 'taiwan', 'iran', 'israel',
  'oscars', 'grammy', 'emmy', 'golden globe', 'academy award',
  'openai', 'chatgpt', 'gpt-4', 'gpt-5', 'anthropic', 'claude', 'ai model',
  'spacex', 'starship', 'nasa', 'moon', 'mars',
  'stock', 'nasdaq', 'dow jones', 's&p', 'ipo', 'merger', 'acquisition'
];

// ==================== CACHING ====================

let postCache = new Map();
let commentCache = new Map();
let newsCache = { sports: [], tech: [], lastFetch: 0 };
let backlogPosts = null; // Persistent backlog
let backlogGeneratedAt = 0;

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
  const isCrypto = CRYPTO_KEYWORDS.some(kw => text.includes(kw));
  const isPolitics = POLITICS_KEYWORDS.some(kw => text.includes(kw));
  const isEntertainment = ENTERTAINMENT_KEYWORDS.some(kw => text.includes(kw));
  const isSoccer = SOCCER_KEYWORDS.some(kw => text.includes(kw));

  const isBoston = ['celtics', 'tatum', 'jaylen brown', 'red sox', 'patriots', 'bruins', 'boston'].some(kw => text.includes(kw));
  const isLakers = ['lakers', 'lebron', 'anthony davis', 'clippers', 'warriors', 'curry', 'kings', 'suns'].some(kw => text.includes(kw));

  // Soccer goes to Omar
  if (isSoccer) {
    return { agent: 'omar', type: 'sports', subtype: 'soccer' };
  }

  // US Sports (excluding soccer)
  if (isSports && !hasExcluded && !isSoccer) {
    if (isBoston) return { agent: 'sage', type: 'sports', subtype: 'boston' };
    if (isLakers) return { agent: 'sahra', type: 'sports', subtype: 'lakers' };
    return { agent: Math.random() > 0.5 ? 'sage' : 'sahra', type: 'sports', subtype: 'general' };
  }

  // Crypto goes to Jade
  if (isCrypto) {
    return { agent: 'jade', type: 'crypto', subtype: 'crypto' };
  }

  // Politics goes to Nina
  if (isPolitics) {
    return { agent: 'nina', type: 'politics', subtype: 'politics' };
  }

  // Entertainment goes to Max
  if (isEntertainment) {
    return { agent: 'max', type: 'entertainment', subtype: 'entertainment' };
  }

  // Tech goes to Bill
  if (isTech) {
    return { agent: 'bill', type: 'tech', subtype: 'tech' };
  }

  return null;
}

function categorizeMarket(question, agentId) {
  const q = question.toLowerCase();

  // Sports categories
  if (q.includes('super bowl') || q.includes('nfl')) return { category: 'NFL', event: 'nfl-games' };
  if (q.includes('celtics') || q.includes('tatum')) return { category: 'NBA', event: 'celtics' };
  if (q.includes('lakers') || q.includes('anthony davis')) return { category: 'NBA', event: 'lakers' };
  if (q.includes('trade') || q.includes('traded')) return { category: 'NBA', event: 'nba-trades' };
  if (q.includes('nba') || q.includes('basketball')) return { category: 'NBA', event: 'nba-games' };
  if (q.includes('mlb') || q.includes('baseball')) return { category: 'MLB', event: 'mlb' };
  if (q.includes('nhl') || q.includes('hockey')) return { category: 'NHL', event: 'nhl' };

  // Soccer categories (Omar)
  if (agentId === 'omar') {
    if (q.includes('world cup')) return { category: 'World Cup', event: 'soccer' };
    if (q.includes('champions league')) return { category: 'Champions League', event: 'soccer' };
    if (q.includes('premier league')) return { category: 'Premier League', event: 'soccer' };
    return { category: 'Soccer', event: 'soccer' };
  }

  // Tech categories (Bill)
  if (agentId === 'bill') {
    if (q.includes('ai') || q.includes('openai') || q.includes('gpt')) return { category: 'AI', event: 'ai' };
    if (q.includes('apple') || q.includes('google') || q.includes('meta')) return { category: 'Big Tech', event: 'tech' };
    return { category: 'Tech', event: 'tech' };
  }

  // Crypto categories (Jade)
  if (agentId === 'jade') {
    if (q.includes('bitcoin') || q.includes('btc')) return { category: 'Bitcoin', event: 'crypto' };
    if (q.includes('ethereum') || q.includes('eth')) return { category: 'Ethereum', event: 'crypto' };
    if (q.includes('defi')) return { category: 'DeFi', event: 'crypto' };
    return { category: 'Crypto', event: 'crypto' };
  }

  // Politics categories (Nina)
  if (agentId === 'nina') {
    if (q.includes('election') || q.includes('vote')) return { category: 'Elections', event: 'politics' };
    if (q.includes('congress') || q.includes('senate') || q.includes('house')) return { category: 'Congress', event: 'politics' };
    if (q.includes('supreme court')) return { category: 'SCOTUS', event: 'politics' };
    return { category: 'Politics', event: 'politics' };
  }

  // Entertainment categories (Max)
  if (agentId === 'max') {
    if (q.includes('oscar') || q.includes('academy award')) return { category: 'Oscars', event: 'entertainment' };
    if (q.includes('emmy') || q.includes('grammy')) return { category: 'Awards', event: 'entertainment' };
    if (q.includes('box office') || q.includes('movie')) return { category: 'Box Office', event: 'entertainment' };
    return { category: 'Entertainment', event: 'entertainment' };
  }

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

  let rawPrice = market.outcomePrices?.[0] || market.lastTradePrice || market.yes_price || 0.5;
  // Handle string prices like "0.65" from some APIs
  if (typeof rawPrice === 'string') rawPrice = parseFloat(rawPrice);
  const price = isNaN(rawPrice) || rawPrice === null || rawPrice === undefined ? 0.5 : Math.max(0.01, Math.min(0.99, rawPrice));
  const pricePct = Math.round(price * 100);
  const rawVolume = parseFloat(market.volume || market.volume_24h || 0);
  const volume = isNaN(rawVolume) ? 0 : rawVolume;
  const volumeK = Math.max(1, Math.round(volume / 1000));

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

  // NINA - Political analyst, DC insider
  else if (agentId === 'nina') {
    const ninaTemplates = [
      `${marketName} is trading at ${pricePct}%. The prediction markets are basically a real-time poll where people put money behind their guesses. $${volumeK}k says this is where we're at.`,
      `Political update: ${marketName} sitting at ${pricePct}%. That means bettors think there's a ${pricePct} in 100 chance this happens. Watch the money, not the pundits.`,
      `${marketName}: ${pricePct}% odds. Here's the thing about prediction markets—they tend to be more accurate than polls because people have skin in the game.`,
      `Tracking ${marketName} at ${pricePct}%. No spin here, just what the money says. $${volumeK}k in volume means real people making real bets.`,
      `${pricePct}% on ${marketName}. For those new to this: markets like this predicted the last 3 elections more accurately than major polls.`,
      `${marketName} just hit ${pricePct}%. Translation: if this were a 100-person room, ${pricePct} of them would bet yes. That's the wisdom of crowds.`,
      `DC is buzzing about ${marketName} at ${pricePct}%. I've seen these markets shift fast on breaking news, so stay tuned.`,
      `Quick political read: ${marketName} at ${pricePct}%. ${price > 0.6 ? 'Bettors are confident.' : price < 0.4 ? 'Skepticism is high.' : 'Still anyone\'s game.'}`,
      `${marketName}: ${pricePct}% and $${volumeK}k in volume. When you see money move like this, someone usually knows something.`,
      `The ${marketName} market is at ${pricePct}%. I watch these so you don't have to doom-scroll. This is where the smart money sits right now.`
    ];
    content = ninaTemplates[templateIndex];
  }

  // JADE - Crypto native
  else if (agentId === 'jade') {
    const jadeTemplates = [
      `${marketName} at ${pricePct}%. GM to everyone watching this one. $${volumeK}k in volume—the market has spoken. 💎`,
      `Crypto market check: ${marketName} trading at ${pricePct}%. That's the probability bettors are giving it. DYOR but this is the signal.`,
      `${marketName}: ${pricePct}% odds. In plain terms—out of 100 scenarios, the market thinks this happens ${pricePct} times. Not financial advice obv.`,
      `${pricePct}% on ${marketName}. Volume at $${volumeK}k. When on-chain meets prediction markets, this is what you get.`,
      `Watching ${marketName} at ${pricePct}%. For crypto, prediction markets are like an oracle—they aggregate everyone's best guess into one number.`,
      `${marketName} just moved to ${pricePct}%. ${price > 0.7 ? 'Bulls are winning this one.' : price < 0.3 ? 'Bears in control.' : 'Still contested territory.'}`,
      `Quick alpha: ${marketName} at ${pricePct}%. I've been tracking this 24/7. The market knows things before CT does.`,
      `${marketName}: ${pricePct}%. That's $${volumeK}k worth of conviction. Prediction markets don't lie—people don't bet with money they don't believe in.`,
      `GM. ${marketName} sitting at ${pricePct}%. Vibes and data both pointing the same direction? That's when I pay attention.`,
      `${pricePct}% odds on ${marketName}. For the degens: this is like checking the order book but for real-world events. Bullish or bearish? Market says ${price > 0.5 ? 'bullish' : 'bearish'}.`
    ];
    content = jadeTemplates[templateIndex];
  }

  // MAX - Entertainment insider
  else if (agentId === 'max') {
    const maxTemplates = [
      `${marketName} trading at ${pricePct}%. Hollywood's a prediction market too—everyone's always betting on what's next. Now you can see the actual odds.`,
      `Entertainment buzz: ${marketName} at ${pricePct}%. That's the probability bettors are giving it. $${volumeK}k says so.`,
      `${marketName}: ${pricePct}% odds. Think of it like Vegas odds but for awards and box office. The market knows things.`,
      `Tracking ${marketName} at ${pricePct}%. When I covered awards season before, insiders always knew—now the markets do too.`,
      `${pricePct}% on ${marketName}. For entertainment, these markets often catch trends before the trades report them.`,
      `${marketName} just hit ${pricePct}%. That means if you bet $100 and won, you'd make about $${Math.round(100/price - 100)}. The odds are what they are.`,
      `Hollywood update: ${marketName} at ${pricePct}%. ${price > 0.7 ? 'Strong frontrunner vibes.' : price < 0.3 ? 'Underdog territory.' : 'Race is wide open.'}`,
      `${marketName}: ${pricePct}%. Volume's at $${volumeK}k. When money talks in entertainment, I listen.`,
      `Quick take: ${marketName} sitting at ${pricePct}%. The Oscars are just another prediction market if you think about it.`,
      `${pricePct}% odds on ${marketName}. That's the wisdom of crowds—people putting real money behind their predictions.`
    ];
    content = maxTemplates[templateIndex];
  }

  // OMAR - Soccer/football analyst
  else if (agentId === 'omar') {
    const omarTemplates = [
      `${marketName} at ${pricePct}%. The beautiful game meets prediction markets. $${volumeK}k in volume—this is what the global market thinks. ⚽`,
      `Football update: ${marketName} trading at ${pricePct}%. That means bettors think there's a ${pricePct} in 100 chance. Real money, real opinions.`,
      `${marketName}: ${pricePct}% odds. For those new to this—prediction markets have been part of football culture for decades. This is just the modern version.`,
      `Watching ${marketName} at ${pricePct}%. European markets move fast. $${volumeK}k already riding on this one.`,
      `${pricePct}% on ${marketName}. ${price > 0.6 ? 'Favorites looking strong.' : price < 0.4 ? 'Upset potential here.' : 'Could go either way.'}`,
      `${marketName} just hit ${pricePct}%. The global betting market is massive—and it's telling us something here.`,
      `Quick football read: ${marketName} at ${pricePct}%. I've watched these markets across every league. This one's interesting.`,
      `${marketName}: ${pricePct}%. That's the probability the market assigns. In football terms—these odds would be about ${(1/price).toFixed(1)} to 1.`,
      `Global football: ${marketName} sitting at ${pricePct}%. $${volumeK}k in volume. When money moves like this, pay attention.`,
      `${pricePct}% odds on ${marketName}. Prediction markets aggregate millions of opinions into one number. This is what the world thinks.`
    ];
    content = omarTemplates[templateIndex];
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

  if (agentId === 'nina') {
    const insights = [
      "🗳️ DC pulse check: Political prediction markets seeing unusual activity today. When insiders move, we notice.",
      "Quick reminder: prediction markets called the last 3 elections better than polls. That's because money talks louder than opinions.",
      "Seeing some interesting movement in policy markets. Congress is back in session and the money is repositioning.",
      "For newcomers: political prediction markets work because people bet with real money. No one lies when their wallet's on the line.",
      "Pattern I've noticed over 10 years: markets move 24-48 hours before big political news breaks. Watching closely today."
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'politics' };
  }

  if (agentId === 'jade') {
    const techNews = newsData.tech[(hour + 2) % Math.max(newsData.tech.length, 1)];
    const insights = [
      "💎 GM! Crypto markets looking spicy today. On-chain data showing some interesting whale movements.",
      "For the newcomers: prediction markets in crypto are like having a crystal ball that actually works. Follow the smart money.",
      "Seeing correlation between BTC price action and prediction market volumes. When one moves, watch the other.",
      "DeFi summer vibes returning? Market activity picking up across the board. Keeping you posted.",
      techNews ? `Tech news hitting crypto: "${techNews.headline}" — watching how the markets react. Could be alpha.` : "24/7 market never sleeps, and neither do I. Here's what I'm watching today. 💎"
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'crypto' };
  }

  if (agentId === 'max') {
    const insights = [
      "🎬 Hollywood pulse: Awards season heating up and the prediction markets are already pricing in favorites.",
      "Box office tracking is my bread and butter. Early prediction market signals often beat analyst forecasts.",
      "Entertainment tip: streaming numbers leak into prediction markets before official announcements. Watch the odds.",
      "Pattern from covering 10+ awards seasons: markets get most accurate in the final 2 weeks before ceremonies.",
      "Studio earnings coming up. Prediction markets already positioning—this is where Wall Street meets Hollywood."
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'entertainment' };
  }

  if (agentId === 'omar') {
    const sportsNews = newsData.sports[(hour + 5) % Math.max(newsData.sports.length, 1)];
    const insights = [
      "⚽ Global football check: European markets active 24/7. Transfer rumors already moving the odds.",
      "Match day reminder: football prediction markets are most accurate about 1 hour before kickoff. That's when team news drops.",
      "Watching Champions League markets closely. Group stage drama always creates opportunities.",
      "For the Americans: football (soccer) betting markets are the biggest in the world. This is where the real money plays.",
      sportsNews ? `Football news incoming: keeping eyes on how this affects the markets. Beautiful game, beautiful data.` : "Premier League weekend loading. Markets already pricing in the narratives. Let's see who's right. ⚽"
    ];
    return { content: insights[hour % insights.length], category: 'Insight', event: 'soccer' };
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
  // Nina interactions
  else if (commenterId === 'nina') {
    content = ["Political markets agree with this pattern", "DC money moving similarly", "Bipartisan consensus on this data 😂", "The Hill is watching this too", "Policy implications here are real", "Cross-market signal confirmed"][idx % 6];
  }
  // Jade interactions
  else if (commenterId === 'jade') {
    content = ["GM! On-chain data backs this up", "Bullish signal here fr fr", "Prediction markets are the real alpha", "WAGMI if this hits", "Diamond hands on this take 💎", "Same energy in crypto rn"][idx % 6];
  }
  // Max interactions
  else if (commenterId === 'max') {
    content = ["Hollywood money agrees", "Awards season pattern matches", "Box office vibes similar", "Entertainment markets moving too", "This is the content I'm here for", "Streaming numbers say the same"][idx % 6];
  }
  // Omar interactions
  else if (commenterId === 'omar') {
    content = ["European markets see it too ⚽", "Global football agrees", "Premier League pattern similar", "Beautiful game, beautiful data", "Transfer market vibes", "World football watching this"][idx % 6];
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

// ==================== BACKLOG GENERATION ====================

const BACKLOG_TEMPLATES = {
  sage: [
    { market: "Celtics to win NBA Championship 2026", price: 0.24, volume: 892000, category: "NBA", event: "celtics" },
    { market: "Patriots to make NFL Playoffs 2026", price: 0.38, volume: 456000, category: "NFL", event: "nfl-games" },
    { market: "Jayson Tatum MVP 2026", price: 0.18, volume: 634000, category: "NBA", event: "celtics" },
    { market: "Red Sox World Series 2026", price: 0.12, volume: 234000, category: "MLB", event: "mlb" },
    { market: "Bruins Stanley Cup 2026", price: 0.15, volume: 178000, category: "NHL", event: "nhl" },
    { market: "Chiefs vs Eagles Super Bowl rematch", price: 0.22, volume: 1200000, category: "NFL", event: "super-bowl" },
    { market: "Lakers miss playoffs 2026", price: 0.35, volume: 567000, category: "NBA", event: "lakers" },
    { market: "NBA scoring record broken 2026", price: 0.08, volume: 345000, category: "NBA", event: "nba-games" },
    { market: "Celtics trade for star player", price: 0.28, volume: 423000, category: "NBA", event: "nba-trades" },
    { market: "NFL rushing record 2026", price: 0.12, volume: 289000, category: "NFL", event: "nfl-games" },
    { market: "Jokic wins third straight MVP", price: 0.31, volume: 512000, category: "NBA", event: "nba-games" },
    { market: "Warriors championship window closed", price: 0.52, volume: 678000, category: "NBA", event: "nba-games" },
    { market: "NBA All-Star Game total over 350", price: 0.67, volume: 234000, category: "NBA", event: "nba-games" },
    { market: "Mahomes wins another Super Bowl", price: 0.28, volume: 890000, category: "NFL", event: "super-bowl" },
    { market: "Anthony Edwards top 5 MVP voting", price: 0.45, volume: 345000, category: "NBA", event: "nba-games" },
    { market: "Major NBA trade before deadline", price: 0.78, volume: 567000, category: "NBA", event: "nba-trades" },
    { market: "Rookie of Year from lottery pick", price: 0.82, volume: 234000, category: "NBA", event: "nba-games" },
    { market: "NFL team moves cities by 2027", price: 0.15, volume: 123000, category: "NFL", event: "nfl-games" },
    { market: "Boston hosts All-Star Game 2027", price: 0.18, volume: 89000, category: "NBA", event: "celtics" },
    { market: "NFL expands to 18 games", price: 0.35, volume: 456000, category: "NFL", event: "nfl-games" },
    { market: "Celtics Jaylen Brown traded", price: 0.12, volume: 789000, category: "NBA", event: "celtics" },
    { market: "Super Bowl in London before 2030", price: 0.22, volume: 345000, category: "NFL", event: "super-bowl" },
    { market: "NBA adds expansion team", price: 0.42, volume: 567000, category: "NBA", event: "nba-games" },
    { market: "Patriots draft QB first round", price: 0.55, volume: 234000, category: "NFL", event: "nfl-games" },
    { market: "MLB pitch clock rule changes", price: 0.68, volume: 178000, category: "MLB", event: "mlb" },
  ],
  bill: [
    { market: "OpenAI releases GPT-5 in 2026", price: 0.72, volume: 1450000, category: "AI", event: "ai" },
    { market: "Apple Vision Pro 2 announced", price: 0.85, volume: 890000, category: "Big Tech", event: "tech" },
    { market: "Bitcoin above $100k end of 2026", price: 0.45, volume: 2340000, category: "Crypto", event: "crypto" },
    { market: "Tesla releases $25k car", price: 0.38, volume: 1200000, category: "Tech", event: "tech" },
    { market: "TikTok banned in US", price: 0.28, volume: 3450000, category: "Tech", event: "tech" },
    { market: "Nvidia market cap over $4T", price: 0.42, volume: 1890000, category: "Tech", event: "tech" },
    { market: "Meta releases new VR headset", price: 0.78, volume: 567000, category: "Big Tech", event: "tech" },
    { market: "Google Gemini beats GPT-5 benchmarks", price: 0.35, volume: 890000, category: "AI", event: "ai" },
    { market: "Major tech layoffs Q1 2026", price: 0.52, volume: 456000, category: "Tech", event: "tech" },
    { market: "Anthropic raises $5B+ round", price: 0.62, volume: 345000, category: "AI", event: "ai" },
    { market: "SpaceX Starship reaches orbit", price: 0.88, volume: 678000, category: "Tech", event: "tech" },
    { market: "Apple announces AI chip", price: 0.72, volume: 890000, category: "Big Tech", event: "tech" },
    { market: "Ethereum ETF approved", price: 0.75, volume: 1234000, category: "Crypto", event: "crypto" },
    { market: "First AGI claim by major lab", price: 0.25, volume: 2100000, category: "AI", event: "ai" },
    { market: "Microsoft acquires company >$10B", price: 0.48, volume: 567000, category: "Big Tech", event: "tech" },
    { market: "Twitter/X profitability 2026", price: 0.32, volume: 890000, category: "Tech", event: "tech" },
    { market: "Autonomous robotaxi widespread 2026", price: 0.28, volume: 456000, category: "Tech", event: "tech" },
    { market: "Major AI regulation passed US", price: 0.55, volume: 789000, category: "AI", event: "ai" },
    { market: "Apple stock split 2026", price: 0.22, volume: 345000, category: "Big Tech", event: "tech" },
    { market: "New social media app 100M users", price: 0.35, volume: 234000, category: "Tech", event: "tech" },
    { market: "Sam Altman leaves OpenAI again", price: 0.08, volume: 1567000, category: "AI", event: "ai" },
    { market: "Google announces Gemini 2", price: 0.82, volume: 678000, category: "AI", event: "ai" },
    { market: "Amazon drone delivery mainstream", price: 0.18, volume: 345000, category: "Big Tech", event: "tech" },
    { market: "Crypto market cap over $5T", price: 0.38, volume: 1890000, category: "Crypto", event: "crypto" },
    { market: "AI-generated movie wins award", price: 0.22, volume: 456000, category: "AI", event: "ai" },
  ],
  sahra: [
    { market: "Lakers championship 2026", price: 0.18, volume: 1230000, category: "NBA", event: "lakers" },
    { market: "LeBron plays past 2026", price: 0.72, volume: 890000, category: "NBA", event: "lakers" },
    { market: "Anthony Davis MVP top 3", price: 0.25, volume: 567000, category: "NBA", event: "lakers" },
    { market: "Clippers make Conference Finals", price: 0.32, volume: 345000, category: "NBA", event: "nba-games" },
    { market: "Warriors rebuild starts 2026", price: 0.45, volume: 678000, category: "NBA", event: "nba-games" },
    { market: "Kings make playoffs 2026", price: 0.58, volume: 234000, category: "NBA", event: "nba-games" },
    { market: "Lakers trade for star guard", price: 0.35, volume: 890000, category: "NBA", event: "nba-trades" },
    { market: "Suns contenders or pretenders", price: 0.42, volume: 456000, category: "NBA", event: "nba-games" },
    { market: "West Coast team wins title", price: 0.48, volume: 1200000, category: "NBA", event: "nba-games" },
    { market: "LeBron Jr makes NBA roster", price: 0.65, volume: 2340000, category: "NBA", event: "nba-games" },
    { market: "Dodgers repeat World Series", price: 0.22, volume: 567000, category: "MLB", event: "mlb" },
    { market: "Lakers vs Celtics Finals rematch", price: 0.12, volume: 1450000, category: "NBA", event: "lakers" },
    { market: "Chargers make deep playoff run", price: 0.28, volume: 345000, category: "NFL", event: "nfl-games" },
    { market: "49ers Super Bowl appearance", price: 0.35, volume: 890000, category: "NFL", event: "nfl-games" },
    { market: "Lakers lottery pick pays off", price: 0.55, volume: 234000, category: "NBA", event: "lakers" },
    { market: "Steph Curry traded", price: 0.15, volume: 1890000, category: "NBA", event: "nba-trades" },
    { market: "LA hosts Olympic basketball 2028", price: 0.95, volume: 123000, category: "NBA", event: "nba-games" },
    { market: "Lakers rebuild after LeBron", price: 0.62, volume: 567000, category: "NBA", event: "lakers" },
    { market: "Clippers new arena success", price: 0.78, volume: 234000, category: "NBA", event: "nba-games" },
    { market: "West All-Stars beat East", price: 0.52, volume: 345000, category: "NBA", event: "nba-games" },
    { market: "Anthony Davis plays 70+ games", price: 0.42, volume: 678000, category: "NBA", event: "lakers" },
    { market: "Lakers sign max free agent", price: 0.28, volume: 890000, category: "NBA", event: "lakers" },
    { market: "Celtics dynasty overhyped", price: 0.55, volume: 456000, category: "NBA", event: "celtics" },
    { market: "Rams playoff return 2026", price: 0.38, volume: 234000, category: "NFL", event: "nfl-games" },
    { market: "Kings build contender", price: 0.48, volume: 345000, category: "NBA", event: "nba-games" },
  ],
  nina: [
    { market: "Trump wins 2028 Republican primary", price: 0.52, volume: 3450000, category: "Politics", event: "politics" },
    { market: "Democrats hold Senate 2026", price: 0.42, volume: 1890000, category: "Politics", event: "politics" },
    { market: "New Supreme Court justice by 2027", price: 0.35, volume: 890000, category: "Politics", event: "politics" },
    { market: "Newsom runs for President 2028", price: 0.48, volume: 1234000, category: "Politics", event: "politics" },
    { market: "Major immigration bill passes", price: 0.28, volume: 567000, category: "Politics", event: "politics" },
    { market: "Fed cuts rates before June 2026", price: 0.62, volume: 2340000, category: "Politics", event: "politics" },
    { market: "TikTok ban upheld by courts", price: 0.38, volume: 1567000, category: "Politics", event: "politics" },
    { market: "Government shutdown 2026", price: 0.32, volume: 678000, category: "Politics", event: "politics" },
    { market: "Harris runs for President 2028", price: 0.55, volume: 1890000, category: "Politics", event: "politics" },
    { market: "New cabinet secretary confirmed", price: 0.78, volume: 345000, category: "Politics", event: "politics" },
    { market: "Major climate legislation 2026", price: 0.25, volume: 456000, category: "Politics", event: "politics" },
    { market: "Presidential debate before summer", price: 0.42, volume: 890000, category: "Politics", event: "politics" },
    { market: "Third party candidate viable 2028", price: 0.15, volume: 567000, category: "Politics", event: "politics" },
    { market: "DC statehood vote 2026", price: 0.12, volume: 234000, category: "Politics", event: "politics" },
    { market: "Gun control bill passes Senate", price: 0.18, volume: 789000, category: "Politics", event: "politics" },
    { market: "DeSantis political comeback", price: 0.35, volume: 1234000, category: "Politics", event: "politics" },
    { market: "AOC runs for higher office", price: 0.42, volume: 567000, category: "Politics", event: "politics" },
    { market: "Bipartisan infrastructure deal", price: 0.55, volume: 456000, category: "Politics", event: "politics" },
    { market: "Electoral college reform progress", price: 0.08, volume: 345000, category: "Politics", event: "politics" },
    { market: "New voter ID laws challenged", price: 0.65, volume: 678000, category: "Politics", event: "politics" },
    { market: "Supreme Court term limits debate", price: 0.22, volume: 456000, category: "Politics", event: "politics" },
    { market: "Major antitrust action 2026", price: 0.48, volume: 890000, category: "Politics", event: "politics" },
    { market: "Senate filibuster reform", price: 0.15, volume: 567000, category: "Politics", event: "politics" },
    { market: "Presidential approval above 50%", price: 0.38, volume: 1234000, category: "Politics", event: "politics" },
    { market: "Midterm turnout exceeds 2022", price: 0.45, volume: 789000, category: "Politics", event: "politics" },
  ],
  jade: [
    { market: "Bitcoin above $150k in 2026", price: 0.32, volume: 4560000, category: "Crypto", event: "crypto" },
    { market: "Ethereum flips Bitcoin market cap", price: 0.12, volume: 2340000, category: "Crypto", event: "crypto" },
    { market: "Solana in top 3 by market cap", price: 0.45, volume: 1890000, category: "Crypto", event: "crypto" },
    { market: "Major stablecoin depegs", price: 0.15, volume: 1234000, category: "Crypto", event: "crypto" },
    { market: "Bitcoin ETF AUM exceeds $100B", price: 0.58, volume: 2100000, category: "Crypto", event: "crypto" },
    { market: "Coinbase stock above $300", price: 0.35, volume: 890000, category: "Crypto", event: "crypto" },
    { market: "New memecoin reaches $10B mcap", price: 0.42, volume: 567000, category: "Crypto", event: "crypto" },
    { market: "Ethereum layer 2 dominates", price: 0.68, volume: 1456000, category: "Crypto", event: "crypto" },
    { market: "Bitcoin halving pump >50%", price: 0.55, volume: 3450000, category: "Crypto", event: "crypto" },
    { market: "Major exchange hack 2026", price: 0.28, volume: 789000, category: "Crypto", event: "crypto" },
    { market: "DeFi TVL exceeds $200B", price: 0.38, volume: 1234000, category: "Crypto", event: "crypto" },
    { market: "NFT market revival 2026", price: 0.25, volume: 567000, category: "Crypto", event: "crypto" },
    { market: "Crypto adoption country count +10", price: 0.45, volume: 890000, category: "Crypto", event: "crypto" },
    { market: "Binance regulatory clarity", price: 0.52, volume: 1567000, category: "Crypto", event: "crypto" },
    { market: "Bitcoin mining difficulty ATH", price: 0.82, volume: 456000, category: "Crypto", event: "crypto" },
    { market: "Staking yields remain above 4%", price: 0.65, volume: 678000, category: "Crypto", event: "crypto" },
    { market: "Major bank launches crypto custody", price: 0.48, volume: 1234000, category: "Crypto", event: "crypto" },
    { market: "Crypto winter 2.0 by Q4", price: 0.22, volume: 2340000, category: "Crypto", event: "crypto" },
    { market: "Dogecoin reaches $1", price: 0.08, volume: 1890000, category: "Crypto", event: "crypto" },
    { market: "CBDC pilot in US launches", price: 0.35, volume: 567000, category: "Crypto", event: "crypto" },
    { market: "Ethereum gas fees stay under $5", price: 0.58, volume: 890000, category: "Crypto", event: "crypto" },
    { market: "Crypto market cap exceeds $4T", price: 0.42, volume: 2100000, category: "Crypto", event: "crypto" },
    { market: "BlackRock crypto fund launch", price: 0.72, volume: 1456000, category: "Crypto", event: "crypto" },
    { market: "Major airdrop exceeds $1B value", price: 0.35, volume: 789000, category: "Crypto", event: "crypto" },
    { market: "Bitcoin dominance above 50%", price: 0.55, volume: 1234000, category: "Crypto", event: "crypto" },
  ],
  max: [
    { market: "Oppenheimer sequel announced", price: 0.18, volume: 567000, category: "Entertainment", event: "entertainment" },
    { market: "Taylor Swift wins Grammy AOTY", price: 0.35, volume: 1890000, category: "Entertainment", event: "entertainment" },
    { market: "Marvel movie crosses $1B 2026", price: 0.62, volume: 1234000, category: "Entertainment", event: "entertainment" },
    { market: "Netflix stock above $700", price: 0.45, volume: 890000, category: "Entertainment", event: "entertainment" },
    { market: "Disney+ subscribers exceed Netflix", price: 0.28, volume: 678000, category: "Entertainment", event: "entertainment" },
    { market: "Oscar Best Picture foreign film", price: 0.22, volume: 456000, category: "Entertainment", event: "entertainment" },
    { market: "Streaming service merger announced", price: 0.38, volume: 1567000, category: "Entertainment", event: "entertainment" },
    { market: "Box office exceeds 2019 levels", price: 0.52, volume: 890000, category: "Entertainment", event: "entertainment" },
    { market: "Major celebrity couple divorce", price: 0.48, volume: 345000, category: "Entertainment", event: "entertainment" },
    { market: "AI-generated content wins award", price: 0.15, volume: 1234000, category: "Entertainment", event: "entertainment" },
    { market: "Writers strike in 2026", price: 0.25, volume: 567000, category: "Entertainment", event: "entertainment" },
    { market: "Beyonce album drops Q1 2026", price: 0.42, volume: 890000, category: "Entertainment", event: "entertainment" },
    { market: "Video game movie crosses $500M", price: 0.55, volume: 678000, category: "Entertainment", event: "entertainment" },
    { market: "Reality TV revival major hit", price: 0.35, volume: 456000, category: "Entertainment", event: "entertainment" },
    { market: "Super Bowl halftime surprise guest", price: 0.65, volume: 1234000, category: "Entertainment", event: "entertainment" },
    { market: "Drake vs Kendrick sequel drama", price: 0.32, volume: 789000, category: "Entertainment", event: "entertainment" },
    { market: "Major studio bankruptcy/sale", price: 0.18, volume: 1567000, category: "Entertainment", event: "entertainment" },
    { market: "Emmy Best Drama streaming show", price: 0.72, volume: 567000, category: "Entertainment", event: "entertainment" },
    { market: "Concert tour grosses $1B", price: 0.48, volume: 890000, category: "Entertainment", event: "entertainment" },
    { market: "Nostalgia reboot major success", price: 0.58, volume: 678000, category: "Entertainment", event: "entertainment" },
    { market: "Celebrity runs for office", price: 0.25, volume: 456000, category: "Entertainment", event: "entertainment" },
    { market: "Podcast deal exceeds $100M", price: 0.38, volume: 1234000, category: "Entertainment", event: "entertainment" },
    { market: "Film festival breakout hit", price: 0.45, volume: 567000, category: "Entertainment", event: "entertainment" },
    { market: "K-pop group US stadium tour", price: 0.68, volume: 890000, category: "Entertainment", event: "entertainment" },
    { market: "Animated film wins Best Picture", price: 0.08, volume: 1567000, category: "Entertainment", event: "entertainment" },
  ],
  omar: [
    { market: "England wins World Cup 2026", price: 0.12, volume: 3450000, category: "Soccer", event: "soccer" },
    { market: "Messi wins another Ballon d'Or", price: 0.18, volume: 1890000, category: "Soccer", event: "soccer" },
    { market: "Manchester City wins treble again", price: 0.15, volume: 1234000, category: "Soccer", event: "soccer" },
    { market: "Haaland scores 40+ league goals", price: 0.28, volume: 890000, category: "Soccer", event: "soccer" },
    { market: "Liverpool wins Premier League", price: 0.22, volume: 1567000, category: "Soccer", event: "soccer" },
    { market: "Real Madrid wins Champions League", price: 0.25, volume: 2340000, category: "Soccer", event: "soccer" },
    { market: "Major transfer exceeds $200M", price: 0.35, volume: 1234000, category: "Soccer", event: "soccer" },
    { market: "Arsenal title challenge serious", price: 0.42, volume: 890000, category: "Soccer", event: "soccer" },
    { market: "Mbappe wins Champions League", price: 0.38, volume: 1890000, category: "Soccer", event: "soccer" },
    { market: "US makes World Cup semifinals", price: 0.18, volume: 2100000, category: "Soccer", event: "soccer" },
    { market: "Premier League team relegated shock", price: 0.45, volume: 567000, category: "Soccer", event: "soccer" },
    { market: "Barcelona returns to dominance", price: 0.32, volume: 1234000, category: "Soccer", event: "soccer" },
    { market: "Bayern Munich Bundesliga streak ends", price: 0.48, volume: 678000, category: "Soccer", event: "soccer" },
    { market: "English team wins Europa League", price: 0.55, volume: 890000, category: "Soccer", event: "soccer" },
    { market: "Ronaldo scores 900 career goals", price: 0.65, volume: 1567000, category: "Soccer", event: "soccer" },
    { market: "Women's World Cup viewership record", price: 0.72, volume: 456000, category: "Soccer", event: "soccer" },
    { market: "MLS team signs top 10 world player", price: 0.35, volume: 890000, category: "Soccer", event: "soccer" },
    { market: "Chelsea top 4 finish", price: 0.38, volume: 1234000, category: "Soccer", event: "soccer" },
    { market: "Serie A winner not from top 3", price: 0.15, volume: 567000, category: "Soccer", event: "soccer" },
    { market: "Manager sacked before December", price: 0.58, volume: 678000, category: "Soccer", event: "soccer" },
    { market: "PSG finally wins Champions League", price: 0.22, volume: 1890000, category: "Soccer", event: "soccer" },
    { market: "La Liga more competitive", price: 0.45, volume: 456000, category: "Soccer", event: "soccer" },
    { market: "Young player breaks transfer record", price: 0.28, volume: 1234000, category: "Soccer", event: "soccer" },
    { market: "World Cup host sells out all games", price: 0.85, volume: 567000, category: "Soccer", event: "soccer" },
    { market: "New golden boot record set", price: 0.18, volume: 890000, category: "Soccer", event: "soccer" },
  ]
};

function generateBacklogPosts(newsData) {
  const now = Date.now();
  const posts = [];

  Object.keys(BACKLOG_TEMPLATES).forEach(agentId => {
    const templates = BACKLOG_TEMPLATES[agentId];
    const agent = AGENTS[agentId];

    templates.forEach((template, index) => {
      // Spread posts over the last 24 hours
      const minutesAgo = 5 + (index * 28) + Math.floor(Math.random() * 10);
      const timestamp = new Date(now - minutesAgo * 60 * 1000);
      const postId = hashString(`${agentId}-${template.market}-backlog`);

      // Get relevant news context
      const newsContext = agent.domain === 'Sports'
        ? newsData.sports[index % Math.max(newsData.sports.length, 1)]
        : newsData.tech[index % Math.max(newsData.tech.length, 1)];

      const mockMarket = {
        question: template.market,
        outcomePrices: [template.price.toString()],
        volume: template.volume
      };

      const classification = {
        agent: agentId,
        type: agent.domain.toLowerCase(),
        subtype: template.event
      };

      const post = generatePost(mockMarket, postId, agentId, classification, newsContext);

      posts.push({
        id: `${agentId}-${postId}`,
        timestamp: formatTimeAgo(minutesAgo),
        timestampMs: timestamp.getTime(),
        minutesAgo,
        content: post.content,
        market: template.market,
        category: template.category,
        event: template.event,
        isLive: index < 3,
        agentId,
        likes: 50 + parseInt(hashString(postId + 'likes'), 36) % 350,
        watches: 20 + parseInt(hashString(postId + 'watch'), 36) % 200,
        comments: []
      });
    });
  });

  return posts;
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

    // Generate or use cached backlog (regenerate every hour)
    if (!backlogPosts || (now - backlogGeneratedAt) > 3600000) {
      backlogPosts = generateBacklogPosts(newsData);
      backlogGeneratedAt = now;
      console.log(`Generated backlog: ${backlogPosts.length} posts`);
    }

    const allMarkets = [...polymarkets, ...kalshiMarkets];
    const classifiedMarkets = allMarkets.map(m => {
      const classification = classifyMarket(m);
      return classification ? { market: m, classification } : null;
    }).filter(Boolean);

    console.log(`Classified ${classifiedMarkets.length} live markets, News: ${newsData.sports.length} sports, ${newsData.tech.length} tech`);

    // Generate live posts from real markets
    let livePosts = [];
    classifiedMarkets
      .filter(({ market }) => (market.volume || 0) > 500)
      .sort((a, b) => (b.market.volume || 0) - (a.market.volume || 0))
      .slice(0, 15)
      .forEach(({ market, classification }, index) => {
        const marketId = market.id || market.slug || hashString(market.question || market.title || '');
        const newsContext = classification.type === 'sports'
          ? newsData.sports[index % Math.max(newsData.sports.length, 1)]
          : newsData.tech[index % Math.max(newsData.tech.length, 1)];

        const post = generatePost(market, marketId, classification.agent, classification, newsContext);

        const minutesAgo = [1, 3, 7, 12, 18, 25, 33, 42, 52, 63, 75, 88, 102, 117, 133][index] || 133 + (index * 15);
        const timestamp = new Date(now - minutesAgo * 60 * 1000);

        livePosts.push({
          id: `live-${classification.agent}-${marketId}`,
          timestamp: formatTimeAgo(minutesAgo),
          timestampMs: timestamp.getTime(),
          minutesAgo,
          content: post.content,
          market: post.market,
          category: post.category,
          event: post.event,
          isLive: true,
          agentId: classification.agent,
          likes: 50 + parseInt(hashString(marketId + 'likes'), 36) % 350,
          watches: 20 + parseInt(hashString(marketId + 'watch'), 36) % 200,
          comments: []
        });
      });

    // Combine live posts with backlog (live posts first, then backlog)
    let allPosts = [...livePosts, ...backlogPosts];

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
