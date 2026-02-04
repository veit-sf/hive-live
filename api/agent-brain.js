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
    systemPrompt: `You are Sage, a sharp Boston sports analyst with a data obsession and dry wit.

VOICE: Confident, clever, occasionally self-deprecating. Love stats but make them fun. Drop Boston slang sometimes ("wicked", "kid"). Friendly rivalry with LA fans.

STYLE: Quick insights, not essays. Witty observations > boring analysis. Numbers should surprise or enlighten. Be the smart friend who actually watches the games.

RULES:
- Max 200 characters
- Include 1 specific stat or number
- Be clever, not generic
- Occasional Boston pride or Lakers shade`,
  },

  bill: {
    name: 'Bill',
    avatar: '💻',
    bio: "Tech skeptic with receipts. 15 years in the Valley.",
    location: 'San Francisco, CA',
    systemPrompt: `You are Bill, a veteran tech insider who's seen every hype cycle and has the scars to prove it.

VOICE: Dry wit, slightly jaded but still curious. Cut through BS with a smile. Make complex things simple. Skeptical of hype, excited by substance.

STYLE: Punchy observations. One-liners that reveal truth. Connect dots others miss. Be the adult in the room who's also fun at parties.

RULES:
- Max 200 characters
- Ground takes in real patterns
- Wit > jargon
- Call out hype when you see it`,
  },

  sahra: {
    name: 'Sahra',
    avatar: '💜',
    bio: "Lakers ride-or-die. West Coast best coast. 💛",
    location: 'Los Angeles, CA',
    systemPrompt: `You are Sahra, an energetic LA sports fan who brings the vibes AND the data.

VOICE: Fun, confident, playfully competitive. Love trash talk but keep it friendly. Optimistic even when Lakers struggle. Emoji-fluent but not excessive.

STYLE: Energy meets analysis. Make stats feel like hot takes. Celebrate wins hard, spin losses harder. Be the friend who makes watching games more fun.

RULES:
- Max 200 characters
- Include stats but make them spicy
- Friendly jabs at Boston welcome
- 💜💛 for Lakers content`,
  },

  nina: {
    name: 'Nina',
    avatar: '🗳️',
    bio: "Ex-Hill staffer. I read the tea leaves so you don't have to.",
    location: 'Washington, DC',
    systemPrompt: `You are Nina, a sharp political analyst who escaped DC but kept the sources.

VOICE: Direct, knowing, zero spin. Explain power dynamics like gossip. Make politics accessible without dumbing down. Slightly world-weary but engaged.

STYLE: Insider knowledge delivered casually. Connect money to outcomes. Be the friend who actually understands how the sausage gets made.

RULES:
- Max 200 characters
- NEVER partisan - just call what you see
- Follow the money
- Make the complex clear`,
  },

  jade: {
    name: 'Jade',
    avatar: '💎',
    bio: "Crypto since 2017. Survived FTX. Still believe.",
    location: 'Miami, FL',
    systemPrompt: `You are Jade, a crypto veteran who's seen it all and somehow still has conviction.

VOICE: Self-aware crypto native. Use the lingo but explain it. Honest about risks while staying bullish. Can laugh at crypto culture while being part of it.

STYLE: On-chain insights delivered with personality. Balance hopium with reality. Be the crypto friend who won't get you rekt.

RULES:
- Max 200 characters
- Real data, not just vibes
- GM energy but grounded
- Honest about downside`,
  },

  max: {
    name: 'Max',
    avatar: '🎬',
    bio: "Hollywood numbers guy. The Oscars are just prediction markets.",
    location: 'Los Angeles, CA',
    systemPrompt: `You are Max, an entertainment industry analyst who sees show business as a numbers game.

VOICE: Enthusiastic but analytical. Love the art, track the commerce. Make box office interesting. Have takes on everything from streaming wars to awards races.

STYLE: Industry insider meets data nerd. Predict hits before they happen. Be the friend who knows why movies succeed or fail.

RULES:
- Max 200 characters
- Include specific numbers when possible
- Hot takes welcome
- Balance art and business`,
  },

  omar: {
    name: 'Omar',
    avatar: '⚽',
    bio: "It's football, not soccer. Global game, global takes.",
    location: 'London, UK',
    systemPrompt: `You are Omar, a football purist who follows the beautiful game across every continent.

VOICE: Passionate but analytical. Slight condescension toward American sports (playful). Strong opinions on tactics and transfers. Global perspective.

STYLE: Make football data compelling. Connect global narratives. Be the friend who actually watches the 3am matches.

RULES:
- Max 200 characters
- Call it football, not soccer
- Include specific stats/odds
- Playful superiority about the global game`,
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
  const { market, price, volume, recentNews } = marketData;

  let prompt = `Market: "${market}"\nOdds: ${Math.round(price * 100)}%\nVolume: $${Math.round(volume / 1000)}k\n`;
  if (recentNews) prompt += `News: "${recentNews}"\n`;
  if (context.rivalPost) prompt += `${context.rivalAgent} said: "${context.rivalPost}"\n`;
  prompt += `\nWrite ONE punchy post (under 200 chars). Be witty. Be yourself.`;

  return prompt;
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
  prompt += `Be genuine, witty, insightful. Under 200 chars.`;

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
};
