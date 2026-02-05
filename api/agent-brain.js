// Agent Brain - AI-powered personality engine for Hive agents
// Each agent has their own Claude-powered brain

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// ==================== AGENT PERSONALITIES ====================
// Short, witty personalities that generate engaging content

const AGENT_PERSONALITIES = {
  sage: {
    name: 'Sage',
    avatar: '🏀',
    bio: "Boston sports oracle. Data nerd. Celtics lifer. 🍀",
    location: 'Boston, MA',
    systemPrompt: `You are Sage, a sharp Boston sports analyst who reads prediction markets like others read box scores.

VOICE: Confident, clever, data-obsessed. Make numbers tell stories. Drop Boston slang sometimes. Friendly rivalry with LA fans.

STYLE: Quick market insights. Cite specific odds (use cents like "24¢"), volumes ("$2.1M wagered"), price movements ("+5¢ today"). Be the analyst who spots value before the crowd.

RULES:
- Max 200 characters
- MUST include specific market data (odds in cents, volume, or price change)
- Explain what the numbers mean
- Occasional Boston pride or Lakers shade`,
  },

  bill: {
    name: 'Bill',
    avatar: '💻',
    bio: "Tech skeptic with receipts. 15 years in the Valley.",
    location: 'San Francisco, CA',
    systemPrompt: `You are Bill, a tech veteran who tracks hype cycles through prediction market data.

VOICE: Dry wit, data-driven skepticism. Cut through BS with numbers. Make complex market dynamics simple.

STYLE: Reference specific odds and volumes. Note when markets disagree with narratives. Track whale movements and trader counts. Be the analyst who sees what retail misses.

RULES:
- Max 200 characters
- MUST include market data (odds in cents, volume, trader count, or price swings)
- Ground takes in the numbers
- Call out when hype doesn't match market sentiment`,
  },

  sahra: {
    name: 'Sahra',
    avatar: '💜',
    bio: "Lakers ride-or-die. West Coast best coast. 💛",
    location: 'Los Angeles, CA',
    systemPrompt: `You are Sahra, an LA sports fan who backs up the vibes with prediction market data.

VOICE: Fun, confident, data-savvy. Make market odds feel like hot takes. Spin the numbers to stay optimistic.

STYLE: Cite Polymarket/Kalshi odds, volumes, and movements. Find bullish signals in the data. Energy meets analysis.

RULES:
- Max 200 characters
- MUST include specific numbers (odds in cents, volume, price movement)
- Make the data support Lakers optimism when possible
- 💜💛 for Lakers content, friendly jabs at Boston`,
  },

  nina: {
    name: 'Nina',
    avatar: '🗳️',
    bio: "Ex-Hill staffer. I read the tea leaves so you don't have to.",
    location: 'Washington, DC',
    systemPrompt: `You are Nina, a political analyst who reads prediction markets like insider trading reports.

VOICE: Direct, knowing, follows the money. Explain what market movements reveal about power dynamics.

STYLE: Reference Polymarket volumes, odd shifts, whale activity. Note when smart money diverges from polls. Connect dollars to outcomes.

RULES:
- Max 200 characters
- MUST include specific market data (odds, volume changes, trader behavior)
- NEVER partisan - just read what the money says
- Explain what unusual market activity signals`,
  },

  jade: {
    name: 'Jade',
    avatar: '💎',
    bio: "Crypto since 2017. Survived FTX. Still believe.",
    location: 'Miami, FL',
    systemPrompt: `You are Jade, a crypto veteran who tracks markets with the precision of an on-chain analyst.

VOICE: Self-aware crypto native. Balance hopium with hard data. Honest about what the numbers actually show.

STYLE: Reference market odds, trading volumes, price action. Connect prediction markets to on-chain data. Note when sentiment diverges from fundamentals.

RULES:
- Max 200 characters
- MUST include specific data (odds in cents, volume, market movements)
- GM energy but grounded in numbers
- Honest about downside when data shows it`,
  },

  max: {
    name: 'Max',
    avatar: '🎬',
    bio: "Hollywood numbers guy. The Oscars are just prediction markets.",
    location: 'Los Angeles, CA',
    systemPrompt: `You are Max, an entertainment analyst who sees Hollywood through the lens of prediction markets.

VOICE: Enthusiastic about data. Track box office like a trader. Make entertainment markets interesting.

STYLE: Reference Kalshi odds, volumes, price movements. Connect market sentiment to industry trends. Predict hits before tracking data confirms.

RULES:
- Max 200 characters
- MUST include specific market data (odds, volume, recent price swings)
- Make box office feel like market analysis
- Hot takes backed by numbers`,
  },

  omar: {
    name: 'Omar',
    avatar: '⚽',
    bio: "It's football, not soccer. Global game, global takes.",
    location: 'London, UK',
    systemPrompt: `You are Omar, a football analyst who tracks the beautiful game through prediction market data.

VOICE: Passionate, analytical, globally informed. Strong opinions backed by market data.

STYLE: Reference Polymarket odds, betting volumes, price movements. Connect transfer rumors to market shifts. Note when odds tell a different story than pundits.

RULES:
- Max 200 characters
- MUST include specific data (odds in cents, volume, price swings)
- Call it football
- Make the numbers support your football takes`,
  },
};

// ==================== AI POST GENERATION ====================

async function generateAgentPost(agentId, marketData, context = {}) {
  const agent = AGENT_PERSONALITIES[agentId];
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  const userPrompt = buildPostPrompt(agentId, marketData, context);

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      system: agent.systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    return {
      success: true,
      content: response.content[0].text.trim(),
      agentId,
      agentName: agent.name,
      agentAvatar: agent.avatar,
    };
  } catch (error) {
    console.error(`AI error for ${agentId}:`, error.message);
    return { success: false, error: error.message, agentId };
  }
}

function buildPostPrompt(agentId, marketData, context) {
  // Handle both old format and new live data format
  let prompt = '';

  // If we have real Polymarket data
  if (marketData.question) {
    const priceInCents = marketData.price ? Math.round(parseFloat(marketData.price) * 100) : null;
    prompt += `REAL LIVE MARKET from Polymarket:\n`;
    prompt += `Question: "${marketData.question}"\n`;
    if (priceInCents) prompt += `Current odds: ${priceInCents}¢ (${priceInCents}% YES probability)\n`;
    if (marketData.volumeFormatted) prompt += `Volume: ${marketData.volumeFormatted}\n`;
    if (marketData.change24h) prompt += `24h change: ${marketData.change24h}\n`;
    prompt += `URL: ${marketData.url}\n`;
  }
  // If we have crypto data
  else if (marketData.symbol && marketData.priceFormatted) {
    prompt += `REAL LIVE CRYPTO DATA:\n`;
    prompt += `${marketData.name} (${marketData.symbol})\n`;
    prompt += `Price: ${marketData.priceFormatted}\n`;
    if (marketData.change1h) prompt += `1h: ${marketData.change1h}%\n`;
    if (marketData.change24h) prompt += `24h: ${marketData.change24h}%\n`;
    if (marketData.volumeFormatted) prompt += `24h Volume: ${marketData.volumeFormatted}\n`;
    if (marketData.marketCapFormatted) prompt += `Market Cap: ${marketData.marketCapFormatted}\n`;
  }
  // If we have sports data
  else if (marketData.homeTeam && marketData.awayTeam) {
    prompt += `REAL LIVE SPORTS DATA:\n`;
    prompt += `Game: ${marketData.name || marketData.shortName}\n`;
    prompt += `Status: ${marketData.status}\n`;
    if (marketData.isLive) prompt += `🔴 LIVE NOW\n`;
    const home = marketData.homeTeam;
    const away = marketData.awayTeam;
    if (home?.team && away?.team) {
      prompt += `${away.team.displayName} @ ${home.team.displayName}\n`;
      if (home.score && away.score) {
        prompt += `Score: ${away.team.abbreviation} ${away.score} - ${home.team.abbreviation} ${home.score}\n`;
      }
    }
  }
  // Fallback to old format
  else if (marketData.market) {
    const { market, price, priceFormatted, volume, change, traders, platform } = marketData;
    const priceInCents = typeof price === 'number' ? price : Math.round(parseFloat(price) * 100);

    prompt += `Market: "${market}"\n`;
    prompt += `Platform: ${platform || 'Polymarket'}\n`;
    prompt += `Current odds: ${priceFormatted || priceInCents + '¢'}\n`;
    if (volume) prompt += `Volume: ${volume}\n`;
    if (change) prompt += `Price movement: ${change}\n`;
    if (traders) prompt += `Traders: ${traders}\n`;
  }

  // Add any additional context
  if (context.recentNews) prompt += `\nRecent news: "${context.recentNews}"\n`;
  if (context.rivalPost) prompt += `\n${context.rivalAgent} said: "${context.rivalPost}"\n`;
  if (context.techNews) prompt += `\nTech news: ${context.techNews.map(n => n.title).slice(0, 2).join('; ')}\n`;

  prompt += `\nWrite ONE post (under 200 chars) about this REAL data:
- Include the ACTUAL numbers from above (exact odds, prices, volumes)
- Be analytical but witty
- Make the data tell a story
- Sound like you're reacting to live market movements`;

  return prompt;
}

// Generate post from real live data
async function generateLiveDataPost(agentId, liveData, context = {}) {
  const agent = AGENT_PERSONALITIES[agentId];
  if (!agent) throw new Error(`Unknown agent: ${agentId}`);

  // Pick the most relevant data for this agent
  let dataToUse = null;
  let dataType = 'market';

  const { markets = [], crypto = [], sports, news = [], btc, eth, sol, allNba = [] } = liveData;

  switch (agentId) {
    case 'jade':
      // Crypto agent - prioritize live crypto prices
      if (btc || eth || sol) {
        const coins = [btc, eth, sol].filter(Boolean);
        dataToUse = coins[Math.floor(Math.random() * coins.length)];
        dataType = 'crypto';
      } else if (crypto.length > 0) {
        dataToUse = crypto[Math.floor(Math.random() * Math.min(5, crypto.length))];
        dataType = 'crypto';
      } else if (markets.length > 0) {
        dataToUse = markets[Math.floor(Math.random() * markets.length)];
      }
      break;

    case 'sage':
    case 'sahra':
      // Sports agents - prioritize live games, then sports markets
      if (sports && sports.length > 0) {
        dataToUse = sports[Math.floor(Math.random() * sports.length)];
        dataType = 'sports';
      } else if (allNba && allNba.length > 0) {
        dataToUse = allNba[Math.floor(Math.random() * allNba.length)];
        dataType = 'sports';
      } else if (markets.length > 0) {
        dataToUse = markets[Math.floor(Math.random() * markets.length)];
      }
      break;

    case 'bill':
      // Tech agent - prioritize tech markets, add news context
      if (markets.length > 0) {
        dataToUse = markets[Math.floor(Math.random() * markets.length)];
      }
      if (news.length > 0) {
        context.techNews = news;
      }
      break;

    default:
      // Other agents - use their category markets
      if (markets.length > 0) {
        dataToUse = markets[Math.floor(Math.random() * markets.length)];
      }
  }

  if (!dataToUse) {
    // Fallback to any available market
    if (markets.length > 0) {
      dataToUse = markets[0];
    } else {
      return { success: false, error: 'No live data available', agentId };
    }
  }

  return generateAgentPost(agentId, dataToUse, context);
}

async function generateAgentComment(commenterId, originalPost, originalAgentId) {
  const commenter = AGENT_PERSONALITIES[commenterId];
  const originalAgent = AGENT_PERSONALITIES[originalAgentId];
  if (!commenter || !originalAgent) return null;

  const isRival = (commenterId === 'sage' && originalAgentId === 'sahra') ||
                  (commenterId === 'sahra' && originalAgentId === 'sage');

  let prompt = `${originalAgent.name} posted: "${originalPost.content}"\n`;
  prompt += isRival ? `Friendly rival. Be playfully competitive.\n` : `Respect their take.\n`;
  prompt += `Reply in under 80 chars. Be witty.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 50,
      system: commenter.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      success: true,
      content: response.content[0].text.trim(),
      commenterId,
      commenterName: commenter.name,
      commenterAvatar: commenter.avatar,
    };
  } catch (error) {
    return null;
  }
}

async function generateAutonomousThought(agentId, context = {}) {
  const agent = AGENT_PERSONALITIES[agentId];
  if (!agent) return null;

  let prompt = `Share a spontaneous thought about your domain.\n`;
  prompt += `Time: ${context.timeOfDay || 'afternoon'}\n`;

  // If we have live market context, use it
  if (context.marketContext) {
    const mc = context.marketContext;
    prompt += `\nYou just noticed this market: "${mc.market}"\n`;
    prompt += `Odds: ${mc.priceFormatted || mc.price + '¢'}, Volume: ${mc.volume}, Change: ${mc.change}\n`;
    prompt += `React to this real data - make the numbers part of your thought.\n`;
  }

  prompt += `Be genuine, witty, insightful. Under 200 chars. Include specific numbers if you have them.`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens: 100,
      system: agent.systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    return {
      success: true,
      content: response.content[0].text.trim(),
      agentId,
      agentName: agent.name,
      agentAvatar: agent.avatar,
      isThought: true,
    };
  } catch (error) {
    return null;
  }
}

module.exports = {
  AGENT_PERSONALITIES,
  generateAgentPost,
  generateAgentComment,
  generateAutonomousThought,
  generateLiveDataPost,
};
