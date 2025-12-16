# 🚀 HOW TO USE THE BACKEND

## Quick Start (2 Steps)

### Step 1: Start Backend
```bash
cd backend
node src/server.js
```

You should see:
```
🚀 RoofSource Pro Backend Server
================================
Port: 3001
Ready for requests!
```

**Leave this terminal running!**

### Step 2: Start Frontend (New Terminal)
```bash
npm run dev
```

You should see:
```
VITE v5.4.21  ready in 176 ms
➜  Local:   http://localhost:5173/
```

## Test It's Working

Open: http://localhost:5173/test-backend

Click the buttons:
1. **"Test Product Search"** - searches for shingles
2. **"Test Price Lookup"** - shows real prices from 3 suppliers

## How to Use in Your Quote Workflow

### Example: Search for Products

```javascript
const searchProducts = async (query) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_API}/products/search?q=${query}`
  );
  const { products } = await response.json();
  return products;
};

// Use it
const shingles = await searchProducts('shingles');
console.log(shingles); // Array of shingle products
```

### Example: Get Prices for a Product

```javascript
const getPrices = async (sku) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_API}/products/${sku}/prices`
  );
  const { prices } = await response.json();
  return prices;
};

// Use it
const prices = await getPrices('OC-DUR-DRIFT');
console.log(prices[0]); // Cheapest price (sorted automatically!)
```

### Example: Bulk Price Lookup

```javascript
const getBulkPrices = async (items) => {
  const response = await fetch(
    `${import.meta.env.VITE_BACKEND_API}/products/prices`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        products: items, // [{ sku: 'OC-DUR-DRIFT', quantity: 45 }]
        location: 'Toledo, OH'
      })
    }
  );
  const { results } = await response.json();
  return results;
};
```

## Current Database

The backend has **10 products** with **22 price points**:

### Shingles
- `OC-DUR-DRIFT` - Owens Corning Duration Driftwood
- `OC-DUR-ONYX` - Owens Corning Duration Onyx Black
- `GAF-TIMB-SHAK` - GAF Timberline HDZ Shakewood
- `CT-LANDMARK-MOIRE` - CertainTeed Landmark Moire Black

### Underlayment
- `GAF-TIGER-PAWS` - GAF Tiger Paw Synthetic
- `OC-WEATHERLOCK` - Owens Corning WeatherLock
- `GEN-ICE-WATER` - Ice & Water Shield Roll

### Accessories
- `DRP-EDGE-WHT-10` - Drip Edge White 10ft
- `COIL-NAIL-1.25` - Roofing Coil Nails 1-1/4"
- `AIR-VENT-RIDGE` - Ridge Vent Pro 4ft

## Add More Products

```bash
cd backend
npm run seed  # Re-runs seed data
```

Or edit `backend/src/jobs/seedTestData.js` to add your own products.

## Troubleshooting

### Backend won't start
```bash
cd backend
npm install  # Make sure dependencies are installed
node src/server.js
```

### Frontend can't reach backend

Check `.env.local` has:
```
VITE_BACKEND_API=http://localhost:3001/api
```

Restart frontend after changing `.env.local`:
```bash
# Stop frontend (Ctrl+C)
npm run dev  # Restart
```

### CORS errors

Backend already has CORS enabled. If you still see errors, make sure:
1. Backend is running on port 3001
2. Frontend is running on port 5173
3. Both are on `localhost`

## Production Deployment

See `backend/PRODUCTION_STATUS.md` for deployment instructions.

## Both Servers Must Run

❌ **Won't work:**
- Only frontend running
- Only backend running

✅ **Will work:**
- **Backend** running on http://localhost:3001
- **Frontend** running on http://localhost:5173
- Both at the same time

## Quick Commands Reference

```bash
# Start backend (Terminal 1)
cd backend && node src/server.js

# Start frontend (Terminal 2)
npm run dev

# Test backend directly
curl "http://localhost:3001/api/products/search?q=shingles"

# Check backend health
curl "http://localhost:3001/health"

# Reseed database
cd backend && npm run seed
```

**Pro Tip:** Keep both terminals open in split view so you can see logs from both servers.
