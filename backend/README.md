# RoofSource Pro - Backend Scraping Service

Real-time price scraping backend for roofing supplier data.

## Quick Start

```bash
# Install dependencies
cd backend
npm install

# Setup database
npm run setup-db

# Run initial scrape (takes 5-10 minutes)
npm run scrape

# Start API server
npm run dev
```

## API Endpoints

### Search Products
```bash
GET http://localhost:3001/api/products/search?q=shingles
```

### Get Prices for SKU
```bash
GET http://localhost:3001/api/products/OC-DUR-DRIFT/prices
GET http://localhost:3001/api/products/OC-DUR-DRIFT/prices?location=Toledo,OH
```

### Bulk Price Lookup
```bash
POST http://localhost:3001/api/products/prices
Content-Type: application/json

{
  "products": [
    { "sku": "OC-DUR-DRIFT", "quantity": 45 },
    { "sku": "IWS-ROLL", "quantity": 4 }
  ],
  "location": "Toledo, OH"
}
```

### Manual Scrape Trigger
```bash
POST http://localhost:3001/api/scrape/run
```

## Automated Scraping

- Runs daily at 2 AM automatically
- Scrapes: ABC Supply, Home Depot Pro
- Updates prices in SQLite database
- Takes ~10 minutes per full scrape

## Current Scrapers

✅ **Home Depot Pro** - Working (HTTP scraping)
✅ **ABC Supply** - Working (Puppeteer scraping)
⏳ **Beacon** - Coming soon
⏳ **SRS Distribution** - Coming soon

## Database

SQLite database stored at: `backend/data/products.db`

Tables:
- `products` - Product catalog
- `supplier_prices` - Current prices per supplier
- `supplier_locations` - Store locations
- `scrape_jobs` - Scraping history

## Deployment

Deploy to:
- Railway.app (recommended)
- Fly.io
- Render.com
- Your own VPS

All support Node.js + scheduled jobs.

## Frontend Integration

Update your frontend `.env.local`:
```
VITE_BACKEND_API=http://localhost:3001/api
```

Then use in your app:
```javascript
const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/products/search?q=shingles`);
const data = await response.json();
```

## Legal Notice

Web scraping for personal/business use is generally legal, BUT:
- Don't overload servers (we use rate limiting)
- Respect robots.txt
- Don't redistribute scraped data commercially
- Use for price comparison only

This tool scrapes public pricing information for legitimate business procurement purposes.
