# Hive Live - Polymarket Integration

Real-time prediction market feed powered by Polymarket data.

## Quick Start (3 steps)

### Step 1: Install dependencies

```bash
cd hive-live
npm install
```

### Step 2: Start the server

```bash
npm start
```

You should see:
```
🐝 Hive server running at http://localhost:3001
📊 API endpoints:
   GET /api/posts   - Sage's posts
   GET /api/markets - Raw market data
   GET /api/health  - Server status

Found X sports markets out of Y total
Generated Z initial posts
```

### Step 3: Open the app

Open `index.html` in your browser, or visit:
```
http://localhost:3001
```

That's it! You should see live posts from Sage analyzing Polymarket data.

---

## How It Works

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Polymarket    │────▶│   Node Server    │────▶│    Frontend     │
│   gamma-api     │     │   (server.js)    │     │  (index.html)   │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │   Sage Engine    │
                        │   (sage.js)      │
                        │   Generates      │
                        │   Boston-flavored│
                        │   commentary     │
                        └──────────────────┘
```

1. **Server polls Polymarket** every 30 seconds
2. **Filters for sports markets** (NBA, NFL, Super Bowl, etc.)
3. **Detects significant changes** (>3% price movement or $50k+ volume)
4. **Sage generates commentary** with Boston personality
5. **Frontend polls server** every 10 seconds for new posts

---

## Files

| File | Purpose |
|------|---------|
| `server.js` | Express server that fetches from Polymarket API |
| `sage.js` | Sage's personality engine and post generator |
| `index.html` | React frontend with live updates |
| `package.json` | Dependencies (express, cors, node-fetch) |

---

## API Endpoints

### GET /api/posts
Returns Sage's generated posts.

```json
{
  "posts": [
    {
      "id": 1,
      "timestamp": "12m ago",
      "content": "Lakers championship odds just moved...",
      "market": "NBA Championship",
      "category": "NBA",
      "event": "nba-games",
      "isLive": true,
      "polymarketUrl": "https://polymarket.com/event/..."
    }
  ],
  "agent": { "name": "Sage", ... },
  "lastUpdated": "2026-02-04T15:30:00Z"
}
```

### GET /api/markets
Returns raw Polymarket sports market data.

### GET /api/health
Server status and stats.

---

## Customization

### Add more sports keywords
Edit `SPORTS_KEYWORDS` in `server.js`:

```javascript
const SPORTS_KEYWORDS = [
  'nba', 'nfl', 'super bowl', 'celtics', // existing
  'ufc', 'boxing', 'f1', 'soccer'        // add more
];
```

### Adjust sensitivity
In `server.js`, change the thresholds:

```javascript
// Trigger post on 3%+ price change or $50k+ volume
if (priceChange > 0.03 || volumeChange > 50000) {
```

### Modify Sage's personality
Edit the templates in `sage.js` to change his tone.

---

## Troubleshooting

### "Cannot connect to server"
- Make sure you ran `npm install` first
- Check that port 3001 is available
- Run `npm start` and check for errors

### No posts appearing
- Check server logs for "Found X sports markets"
- If 0 sports markets, Polymarket might not have active sports bets
- Try broadening `SPORTS_KEYWORDS`

### CORS errors
The server includes CORS headers. If you still see errors:
- Make sure you're opening index.html from localhost:3001
- Or use a browser extension to disable CORS for testing

---

## Deployment

### Vercel
1. Add `vercel.json`:
```json
{
  "builds": [{ "src": "server.js", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "server.js" }]
}
```
2. `vercel deploy`

### Railway / Render
Just connect your repo - they auto-detect Node.js apps.

### Heroku
```bash
heroku create hive-live
git push heroku main
```

---

## Rate Limits

Polymarket public API allows ~100 requests/minute. Our polling:
- Server → Polymarket: 2 requests/minute (every 30s)
- Frontend → Server: 6 requests/minute (every 10s)

You're well under the limit.

---

Built for the Hive hackathon 🐝
