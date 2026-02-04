/**
 * Sage - Boston Sports Prediction Market Agent
 * Generates witty, data-driven commentary on prediction markets
 */

const SAGE_PROFILE = {
  name: 'Sage',
  handle: '@sage',
  avatar: '🏀',
  bio: "Boston born, data driven. I watch prediction markets so you don't have to. Celtics til I die, but I call it like the numbers show. No trades, no positions—just the truth the market's telling us.",
  domain: 'US Sports',
  marketsTracked: 0, // Updated dynamically
  accuracy: '74.1%',
  followers: '14.2k',
  joined: 'January 2025',
  location: 'Boston, MA'
};

// Categorize market by keywords
function categorizeMarket(question) {
  const q = question.toLowerCase();

  // NFL / Super Bowl
  if (q.includes('super bowl') || q.includes('nfl') || q.includes('chiefs') ||
      q.includes('eagles') || q.includes('bills') || q.includes('lions') ||
      q.includes('49ers') || q.includes('ravens') || q.includes('mahomes')) {
    return {
      category: 'NFL',
      event: q.includes('super bowl') ? 'super-bowl' : 'nfl-games'
    };
  }

  // NBA specific teams/players
  if (q.includes('celtics') || q.includes('tatum') || q.includes('jaylen brown')) {
    return { category: 'NBA', event: 'celtics' };
  }

  if (q.includes('trade') || q.includes('traded')) {
    return { category: 'NBA', event: 'nba-trades' };
  }

  if (q.includes('nba') || q.includes('lakers') || q.includes('warriors') ||
      q.includes('lebron') || q.includes('curry') || q.includes('mvp') ||
      q.includes('championship') || q.includes('playoff')) {
    return { category: 'NBA', event: 'nba-games' };
  }

  // MLB
  if (q.includes('mlb') || q.includes('world series') || q.includes('yankees') ||
      q.includes('dodgers') || q.includes('red sox')) {
    return { category: 'MLB', event: 'mlb' };
  }

  return { category: 'Sports', event: 'general' };
}

// Format market name from question
function formatMarketName(question) {
  // Remove common prefixes and clean up
  let name = question
    .replace(/^Will /i, '')
    .replace(/\?$/, '')
    .replace(/ win .*$/i, '')
    .replace(/ be .*$/i, '');

  // Truncate if too long
  if (name.length > 40) {
    name = name.substring(0, 37) + '...';
  }

  return name;
}

// Generate post content with Sage's personality
function generateSagePost(data) {
  const {
    question,
    currentPrice,
    previousPrice,
    volume,
    volumeChange,
    slug,
    isInitial
  } = data;

  if (!question) return null;

  const { category, event } = categorizeMarket(question);
  const market = formatMarketName(question);

  const pricePct = (currentPrice * 100).toFixed(0);
  const prevPct = (previousPrice * 100).toFixed(0);
  const priceChange = ((currentPrice - previousPrice) * 100).toFixed(1);
  const volumeK = Math.round(volume / 1000);
  const changeK = Math.round(Math.abs(volumeChange) / 1000);

  const priceUp = currentPrice > previousPrice + 0.02;
  const priceDown = currentPrice < previousPrice - 0.02;

  // Boston-flavored templates
  const templates = {
    priceUp: [
      `${market} just moved from ${prevPct}% to ${pricePct}%. $${changeK}k in new volume. Someone knows something—or thinks they do. Market's speaking, I'm just translating.`,
      `Big movement on ${market}. Up ${priceChange} points in the last hour with $${volumeK}k total volume. Either the sharps are loading or the public finally woke up.`,
      `${market} heating up. Now at ${pricePct}%, up from ${prevPct}%. When money moves this fast, pay attention. The market's rarely wrong—just early.`,
      `Interesting. ${market} climbing to ${pricePct}%. Volume's up $${changeK}k. Could be noise, could be signal. I report the data, you make the call.`
    ],
    priceDown: [
      `${market} dropping fast. Was ${prevPct}%, now ${pricePct}%. Market's having second thoughts—or someone knows the fix is in.`,
      `Oof. ${market} down to ${pricePct}% from ${prevPct}%. $${changeK}k in new volume pushing it down. When smart money exits, I pay attention.`,
      `${market} taking a hit. Now at ${pricePct}%. Either this is an overreaction or the market's pricing in something we don't know yet.`
    ],
    stable: [
      `${market} sitting at ${pricePct}% with $${volumeK}k in volume. Market can't find an edge. When that much money is this balanced, it's basically a coin flip with extra steps.`,
      `${market} hasn't moved much—holding at ${pricePct}%. $${volumeK}k in handle but the line's not budging. Equilibrium is rare. Enjoy it while it lasts.`,
      `Current state on ${market}: ${pricePct}% implied probability, $${volumeK}k volume. Market's made up its mind. Doesn't mean it's right.`
    ],
    initial: [
      `Tracking ${market} at ${pricePct}% with $${volumeK}k in volume. That's real money making a statement. Let's see if the market's smarter than the pundits.`,
      `${market}: ${pricePct}% right now. $${volumeK}k says that's the number. I don't argue with volume—I just report what it's telling us.`,
      `Eyes on ${market}. Currently ${pricePct}% implied odds. The market's rarely certain, but it's always interesting.`
    ]
  };

  // Add Boston-specific flavor for Celtics
  if (event === 'celtics') {
    templates.priceUp.push(
      `${market} looking good at ${pricePct}%. Not that I'm biased or anything. Celtics til I die, but the numbers don't lie either.`
    );
  }

  // Select template based on price movement
  let pool;
  if (isInitial) {
    pool = templates.initial;
  } else if (priceUp) {
    pool = templates.priceUp;
  } else if (priceDown) {
    pool = templates.priceDown;
  } else {
    pool = templates.stable;
  }

  const content = pool[Math.floor(Math.random() * pool.length)];

  return {
    content,
    market,
    category,
    event
  };
}

// Generate a response to user questions
function generateSageResponse(question) {
  const responses = [
    "Good question. Looking at the order flow, sharps loaded early. Public's still catching up. Watch the next 30 minutes for direction.",
    "Market's split about 52-48 right now. When it's that close, I trust the money over the models. Someone always knows something.",
    "Historical pattern says this resolves within 2 points of current line. Sample size of 34 since 2020. Not huge, but consistent.",
    "Honestly? Market's being irrational here. But as a wise man once said, markets can stay irrational longer than you can stay solvent.",
    "That's the million dollar question. Literally—there's about $1.2M riding on this exact debate right now.",
    "Data says one thing, my gut says another. I report the data. You can have the gut.",
    "Been tracking this pattern since 2019. Correlation is moderate but consistent. Make of it what you will.",
    "Volume pattern suggests this is already priced in. But 'priced in' is just fancy talk for 'the market got there first.'"
  ];

  return responses[Math.floor(Math.random() * responses.length)];
}

module.exports = {
  SAGE_PROFILE,
  generateSagePost,
  generateSageResponse,
  categorizeMarket
};
