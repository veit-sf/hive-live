// Live Data Fetching - Real-time market data from multiple sources
// Polymarket, CoinGecko, ESPN, and News APIs

const CACHE_DURATION = 60000; // 1 minute cache
let dataCache = {
  polymarket: { data: null, timestamp: 0 },
  crypto: { data: null, timestamp: 0 },
  sports: { data: null, timestamp: 0 },
  news: { data: null, timestamp: 0 },
};

// ==================== POLYMARKET ====================
async function fetchPolymarketData() {
  if (Date.now() - dataCache.polymarket.timestamp < CACHE_DURATION && dataCache.polymarket.data) {
    return dataCache.polymarket.data;
  }

  try {
    // Fetch active markets from Polymarket's gamma API
    const response = await fetch('https://gamma-api.polymarket.com/markets?closed=false&limit=50', {
      headers: { 'Accept': 'application/json' }
    });

    if (!response.ok) throw new Error(`Polymarket API error: ${response.status}`);

    const markets = await response.json();

    // Process and categorize markets
    const processedMarkets = markets
      .filter(m => m.volume && parseFloat(m.volume) > 10000) // Only markets with decent volume
      .map(m => ({
        id: m.id,
        question: m.question,
        slug: m.slug,
        price: m.outcomePrices ? JSON.parse(m.outcomePrices)[0] : null,
        volume: parseFloat(m.volume || 0),
        volumeFormatted: formatVolume(parseFloat(m.volume || 0)),
        liquidity: parseFloat(m.liquidity || 0),
        endDate: m.endDate,
        category: categorizeMarket(m.question),
        url: `https://polymarket.com/event/${m.slug}`,
        change24h: m.change24h || null,
      }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 30);

    dataCache.polymarket = { data: processedMarkets, timestamp: Date.now() };
    return processedMarkets;
  } catch (error) {
    console.error('Polymarket fetch error:', error.message);
    return dataCache.polymarket.data || [];
  }
}

function categorizeMarket(question) {
  const q = question.toLowerCase();
  if (q.includes('bitcoin') || q.includes('btc') || q.includes('ethereum') || q.includes('eth') || q.includes('crypto')) return 'crypto';
  if (q.includes('trump') || q.includes('biden') || q.includes('election') || q.includes('president') || q.includes('congress') || q.includes('senate')) return 'politics';
  if (q.includes('nba') || q.includes('nfl') || q.includes('mlb') || q.includes('celtics') || q.includes('lakers') || q.includes('super bowl')) return 'sports';
  if (q.includes('ai') || q.includes('openai') || q.includes('google') || q.includes('apple') || q.includes('meta') || q.includes('microsoft')) return 'tech';
  if (q.includes('oscar') || q.includes('grammy') || q.includes('movie') || q.includes('film') || q.includes('taylor swift')) return 'entertainment';
  if (q.includes('premier league') || q.includes('champions league') || q.includes('world cup') || q.includes('soccer') || q.includes('football') && !q.includes('nfl')) return 'soccer';
  return 'general';
}

// ==================== COINGECKO (CRYPTO) ====================
async function fetchCryptoData() {
  if (Date.now() - dataCache.crypto.timestamp < CACHE_DURATION && dataCache.crypto.data) {
    return dataCache.crypto.data;
  }

  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&sparkline=false&price_change_percentage=1h,24h,7d',
      { headers: { 'Accept': 'application/json' } }
    );

    if (!response.ok) throw new Error(`CoinGecko API error: ${response.status}`);

    const coins = await response.json();

    const processedCoins = coins.map(coin => ({
      id: coin.id,
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceFormatted: formatPrice(coin.current_price),
      marketCap: coin.market_cap,
      marketCapFormatted: formatVolume(coin.market_cap),
      volume24h: coin.total_volume,
      volumeFormatted: formatVolume(coin.total_volume),
      change1h: coin.price_change_percentage_1h_in_currency?.toFixed(2),
      change24h: coin.price_change_percentage_24h?.toFixed(2),
      change7d: coin.price_change_percentage_7d_in_currency?.toFixed(2),
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      ath: coin.ath,
      athDate: coin.ath_date,
    }));

    dataCache.crypto = { data: processedCoins, timestamp: Date.now() };
    return processedCoins;
  } catch (error) {
    console.error('CoinGecko fetch error:', error.message);
    return dataCache.crypto.data || [];
  }
}

// ==================== ESPN (SPORTS) ====================
async function fetchSportsData() {
  if (Date.now() - dataCache.sports.timestamp < CACHE_DURATION && dataCache.sports.data) {
    return dataCache.sports.data;
  }

  try {
    const [nbaRes, nflRes, mlbRes] = await Promise.allSettled([
      fetch('https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard'),
      fetch('https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard'),
      fetch('https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard'),
    ]);

    const sportsData = { nba: [], nfl: [], mlb: [] };

    // Process NBA
    if (nbaRes.status === 'fulfilled' && nbaRes.value.ok) {
      const nbaData = await nbaRes.value.json();
      sportsData.nba = (nbaData.events || []).map(event => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        status: event.status?.type?.description,
        isLive: event.status?.type?.state === 'in',
        homeTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
        awayTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away'),
        venue: event.competitions?.[0]?.venue?.fullName,
        broadcast: event.competitions?.[0]?.broadcasts?.[0]?.names?.[0],
        startTime: event.date,
      }));
    }

    // Process NFL
    if (nflRes.status === 'fulfilled' && nflRes.value.ok) {
      const nflData = await nflRes.value.json();
      sportsData.nfl = (nflData.events || []).map(event => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        status: event.status?.type?.description,
        isLive: event.status?.type?.state === 'in',
        homeTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
        awayTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away'),
        venue: event.competitions?.[0]?.venue?.fullName,
        startTime: event.date,
      }));
    }

    // Process MLB
    if (mlbRes.status === 'fulfilled' && mlbRes.value.ok) {
      const mlbData = await mlbRes.value.json();
      sportsData.mlb = (mlbData.events || []).map(event => ({
        id: event.id,
        name: event.name,
        shortName: event.shortName,
        status: event.status?.type?.description,
        isLive: event.status?.type?.state === 'in',
        homeTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'home'),
        awayTeam: event.competitions?.[0]?.competitors?.find(c => c.homeAway === 'away'),
        startTime: event.date,
      }));
    }

    dataCache.sports = { data: sportsData, timestamp: Date.now() };
    return sportsData;
  } catch (error) {
    console.error('ESPN fetch error:', error.message);
    return dataCache.sports.data || { nba: [], nfl: [], mlb: [] };
  }
}

// ==================== NEWS (Using free sources) ====================
async function fetchNewsData() {
  if (Date.now() - dataCache.news.timestamp < CACHE_DURATION && dataCache.news.data) {
    return dataCache.news.data;
  }

  try {
    // Use multiple free news sources
    const [techRes, cryptoRes] = await Promise.allSettled([
      // Hacker News top stories
      fetch('https://hacker-news.firebaseio.com/v0/topstories.json'),
      // CoinDesk RSS proxy (if available) or fallback
      fetch('https://api.coingecko.com/api/v3/status_updates?per_page=10'),
    ]);

    const newsData = { tech: [], crypto: [], general: [] };

    // Process Hacker News
    if (techRes.status === 'fulfilled' && techRes.value.ok) {
      const storyIds = await techRes.value.json();
      const topIds = storyIds.slice(0, 10);

      const stories = await Promise.all(
        topIds.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
            .then(r => r.json())
            .catch(() => null)
        )
      );

      newsData.tech = stories
        .filter(s => s && s.title)
        .map(s => ({
          id: s.id,
          title: s.title,
          url: s.url,
          score: s.score,
          comments: s.descendants || 0,
          source: 'Hacker News',
        }));
    }

    // Process crypto news from CoinGecko status updates
    if (cryptoRes.status === 'fulfilled' && cryptoRes.value.ok) {
      const updates = await cryptoRes.value.json();
      newsData.crypto = (updates.status_updates || []).slice(0, 10).map(u => ({
        id: u.id,
        title: u.description?.slice(0, 100),
        project: u.project?.name,
        category: u.category,
        createdAt: u.created_at,
        source: 'CoinGecko',
      }));
    }

    dataCache.news = { data: newsData, timestamp: Date.now() };
    return newsData;
  } catch (error) {
    console.error('News fetch error:', error.message);
    return dataCache.news.data || { tech: [], crypto: [], general: [] };
  }
}

// ==================== HELPERS ====================
function formatVolume(num) {
  if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
  if (num >= 1e3) return `$${(num / 1e3).toFixed(0)}k`;
  return `$${num.toFixed(0)}`;
}

function formatPrice(price) {
  if (price >= 1000) return `$${price.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(4)}`;
}

// ==================== MAIN FETCH FUNCTION ====================
async function fetchAllLiveData() {
  const [polymarket, crypto, sports, news] = await Promise.all([
    fetchPolymarketData(),
    fetchCryptoData(),
    fetchSportsData(),
    fetchNewsData(),
  ]);

  return {
    polymarket,
    crypto,
    sports,
    news,
    timestamp: Date.now(),
  };
}

// ==================== GET DATA FOR SPECIFIC AGENT ====================
function getDataForAgent(agentId, allData) {
  const { polymarket, crypto, sports, news } = allData;

  switch (agentId) {
    case 'sage': // Boston Sports
      return {
        markets: polymarket.filter(m => m.category === 'sports'),
        sports: sports.nba.filter(g =>
          g.homeTeam?.team?.abbreviation === 'BOS' ||
          g.awayTeam?.team?.abbreviation === 'BOS' ||
          g.name?.toLowerCase().includes('celtics')
        ).concat(sports.nfl.filter(g =>
          g.name?.toLowerCase().includes('patriots')
        )),
        allNba: sports.nba,
        news: news.tech.slice(0, 3),
      };

    case 'sahra': // Lakers/West Coast
      return {
        markets: polymarket.filter(m => m.category === 'sports'),
        sports: sports.nba.filter(g =>
          g.homeTeam?.team?.abbreviation === 'LAL' ||
          g.awayTeam?.team?.abbreviation === 'LAL' ||
          g.name?.toLowerCase().includes('lakers')
        ),
        allNba: sports.nba,
        news: [],
      };

    case 'bill': // Tech
      return {
        markets: polymarket.filter(m => m.category === 'tech'),
        news: news.tech,
        crypto: crypto.slice(0, 5), // Tech overlap with crypto
      };

    case 'nina': // Politics
      return {
        markets: polymarket.filter(m => m.category === 'politics'),
        news: news.general,
        topMarkets: polymarket.slice(0, 10), // Politics often in top markets
      };

    case 'jade': // Crypto
      return {
        markets: polymarket.filter(m => m.category === 'crypto'),
        crypto: crypto,
        news: news.crypto,
        btc: crypto.find(c => c.symbol === 'BTC'),
        eth: crypto.find(c => c.symbol === 'ETH'),
        sol: crypto.find(c => c.symbol === 'SOL'),
      };

    case 'max': // Entertainment
      return {
        markets: polymarket.filter(m => m.category === 'entertainment'),
        news: news.tech.filter(n =>
          n.title?.toLowerCase().includes('netflix') ||
          n.title?.toLowerCase().includes('disney') ||
          n.title?.toLowerCase().includes('streaming')
        ),
      };

    case 'omar': // Soccer
      return {
        markets: polymarket.filter(m => m.category === 'soccer'),
        // ESPN doesn't have great soccer data, but we include what we have
        sports: [],
      };

    default:
      return { markets: polymarket.slice(0, 10), crypto: crypto.slice(0, 5) };
  }
}

// ==================== API HANDLER ====================
module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const agentId = req.query.agent;
    const allData = await fetchAllLiveData();

    if (agentId) {
      // Return data specific to an agent
      const agentData = getDataForAgent(agentId, allData);
      res.status(200).json({
        success: true,
        agent: agentId,
        data: agentData,
        timestamp: allData.timestamp,
      });
    } else {
      // Return all data
      res.status(200).json({
        success: true,
        data: allData,
        summary: {
          polymarketCount: allData.polymarket.length,
          cryptoCount: allData.crypto.length,
          nbaGames: allData.sports.nba.length,
          nflGames: allData.sports.nfl.length,
          techNews: allData.news.tech.length,
        },
      });
    }
  } catch (error) {
    console.error('Live data API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Export functions for use in other modules
module.exports.fetchAllLiveData = fetchAllLiveData;
module.exports.getDataForAgent = getDataForAgent;
module.exports.fetchPolymarketData = fetchPolymarketData;
module.exports.fetchCryptoData = fetchCryptoData;
module.exports.fetchSportsData = fetchSportsData;
