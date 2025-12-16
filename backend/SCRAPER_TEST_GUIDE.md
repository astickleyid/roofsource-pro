# 🧪 SCRAPER TESTING & UNDERSTANDING GUIDE

## 📋 What the Scraper Does

### **Home Depot Scraper** (HTTP-based, simpler)
- **Technology**: Axios + Cheerio (no browser needed)
- **How it works**: Makes HTTP requests and parses HTML
- **Target**: https://www.homedepot.com
- **What it scrapes**: 
  - Product name
  - Price
  - SKU
  - Image URL
  - Product URL
- **Saves to**: SQLite database (`backend/data/products.db`)

### **ABC Supply Scraper** (Browser-based, advanced)
- **Technology**: Puppeteer (headless Chrome browser)
- **How it works**: Launches actual browser, navigates like a human
- **Target**: https://www.abcsupply.com
- **Anti-detection features**:
  - Stealth plugin (hides automation)
  - Proxy rotation (avoids IP blocking)
  - CAPTCHA solving (2Captcha integration)
  - Random delays (mimics human behavior)
- **What it scrapes**: Same as Home Depot
- **Saves to**: Same SQLite database

---

## 🎯 TESTING PLAN (Step-by-Step)

### **PHASE 1: Test WITHOUT Proxies/CAPTCHA (Free)**

This tests basic functionality. Home Depot should work, ABC Supply will likely get blocked.

```bash
cd /Users/austinstickley/roofsource-pro/backend

# 1. Install dependencies (if not done)
npm install

# 2. Setup database
npm run setup-db

# 3. Run basic test
npm run test-scraper
```

**Expected Output:**
```
🧪 Testing Enhanced Scrapers

📦 Testing Home Depot Enhanced Scraper...
📡 Request attempt 1/3: https://www.homedepot.com/s/roofing%20shingles
✅ Home Depot - Scraped 24 products for "roofing shingles"
✅ Home Depot: 24 products

📦 Testing ABC Supply Enhanced Scraper...
⚠️  This will launch a browser window...
⚠️  No proxy configured - may get rate limited
🌐 Initializing browser with anti-detection...
📄 Navigating to: https://www.abcsupply.com/shop/roofing
❌ Navigation failed (attempt 1): net::ERR_BLOCKED_BY_CLIENT
💡 This is expected without proxy setup.
```

---

### **PHASE 2: Test WITH Proxies (Costs Money)**

Skip this initially. Test Phase 1 first.

#### Setup Proxy Service:

1. **Sign up for proxy service** (choose one):
   - **SmartProxy**: $75/5GB - Good for testing
   - **Bright Data**: $500/20GB - Best quality
   - **Oxylabs**: $300/10GB - Middle ground

2. **Add credentials to `.env`**:
   ```bash
   cd /Users/austinstickley/roofsource-pro/backend
   cp .env.example .env
   nano .env  # or code .env
   ```

3. **Edit `.env`**:
   ```env
   PROXY_HOST=gate.smartproxy.com
   PROXY_PORT=7000
   PROXY_USERNAME=your-actual-username
   PROXY_PASSWORD=your-actual-password
   ```

4. **Test with proxy**:
   ```bash
   npm run test-scraper
   ```

---

### **PHASE 3: Test CAPTCHA Solving (Optional)**

1. **Sign up for 2Captcha**: https://2captcha.com
   - Cost: $3 per 1000 CAPTCHAs
   - Get API key

2. **Add to `.env`**:
   ```env
   CAPTCHA_API_KEY=your-2captcha-api-key
   ```

3. **Test**:
   ```bash
   npm run test-scraper
   ```

---

## 📊 Understanding the Output

### **Successful Scrape Output:**
```
✅ Home Depot - Scraped 24 products for "roofing shingles"
```
**Means**: Found 24 products, parsed them, saved to database

### **Database Storage:**
Products saved to: `backend/data/products.db`

**Tables:**
1. **products** - Product catalog
   - id, sku, name, manufacturer, category, description, image_url

2. **prices** - Vendor pricing
   - product_id, vendor, vendor_sku, price, unit, in_stock, lead_time, location, url

**Check database:**
```bash
cd /Users/austinstickley/roofsource-pro/backend
sqlite3 data/products.db

# In SQLite prompt:
SELECT COUNT(*) FROM products;
SELECT COUNT(*) FROM prices;
SELECT * FROM products LIMIT 5;
SELECT * FROM prices LIMIT 5;
.exit
```

---

## 🔍 Detailed Test Commands

### **1. Basic Test (Home Depot only)**
```bash
cd /Users/austinstickley/roofsource-pro/backend
npm run test-scraper
```

### **2. Manual Home Depot Test**
Create `testHomeDepot.js`:
```javascript
import HomeDepotEnhanced from './src/scrapers/homeDepotEnhanced.js';
import { setupDatabase } from './src/database/db.js';

(async () => {
  await setupDatabase();
  const scraper = new HomeDepotEnhanced();
  
  console.log('\n🔍 Searching: roofing shingles');
  const count = await scraper.scrapeSearchResults('roofing shingles');
  console.log(`\n✅ Scraped ${count} products`);
})();
```

Run:
```bash
node testHomeDepot.js
```

### **3. Manual ABC Supply Test (with browser visible)**
Create `testABC.js`:
```javascript
import ABCSupplyEnhanced from './src/scrapers/abcSupplyEnhanced.js';
import { setupDatabase } from './src/database/db.js';
import dotenv from 'dotenv';

dotenv.config();
process.env.HEADLESS = 'false';  // Show browser

(async () => {
  await setupDatabase();
  const scraper = new ABCSupplyEnhanced();
  
  await scraper.init();
  console.log('\n🔍 Scraping ABC Supply roofing category');
  
  const count = await scraper.scrapeCategory(
    'https://www.abcsupply.com/shop/roofing'
  );
  
  console.log(`\n✅ Scraped ${count} products`);
  await scraper.close();
})();
```

Run:
```bash
node testABC.js
```

### **4. Test Proxy Connection**
Create `testProxy.js`:
```javascript
import proxyManager from './src/utils/proxyManager.js';
import axios from 'axios';

(async () => {
  const config = proxyManager.getAxiosConfig();
  
  console.log('📡 Testing proxy connection...');
  console.log('Proxy config:', config.proxy);
  
  try {
    const response = await axios.get('https://api.ipify.org?format=json', config);
    console.log('✅ Your IP via proxy:', response.data.ip);
  } catch (error) {
    console.error('❌ Proxy test failed:', error.message);
  }
})();
```

Run:
```bash
node testProxy.js
```

---

## 🎬 Running Full Scrape Job

Once testing works:

```bash
# Run complete scraping job
npm run scrape
```

This runs: `src/jobs/runScrapers.js`

**What it does:**
1. Scrapes Home Depot for 7 product categories
2. Scrapes ABC Supply for 3 categories
3. Saves all to database
4. Takes 15-30 minutes

---

## 📈 Expected Results

### **Without Proxy (Free Test):**
- ✅ Home Depot: 20-30 products per search
- ❌ ABC Supply: Blocked/Rate limited

### **With Proxy ($$$):**
- ✅ Home Depot: 50-100 products
- ✅ ABC Supply: 30-60 products

### **Database Growth:**
- **Initial**: 0 products
- **After test**: 24 products, 24 prices
- **After full scrape**: 200-500 products, 400-1000 prices

---

## 🐛 Troubleshooting

### **Error: "Cannot find module"**
```bash
cd /Users/austinstickley/roofsource-pro/backend
rm -rf node_modules package-lock.json
npm install
```

### **Error: "Database locked"**
```bash
# Close any SQLite connections
killall sqlite3
# Or delete and recreate
rm data/products.db
npm run setup-db
```

### **Error: "Proxy connection failed"**
1. Check `.env` credentials
2. Verify proxy service is active
3. Test proxy separately (see testProxy.js above)

### **Home Depot returns 0 products**
- Their HTML selectors may have changed
- Check: Open https://www.homedepot.com/s/roofing%20shingles
- Inspect product cards
- Update selectors in `homeDepotEnhanced.js`

### **ABC Supply shows blank page**
- They block automated browsers
- Need proxy + stealth plugin
- Or they require login (can't scrape)

---

## 🔐 Security Notes

**DO NOT commit `.env` to Git!**

`.gitignore` already includes it, but verify:
```bash
cd /Users/austinstickley/roofsource-pro/backend
cat .gitignore | grep .env
# Should show: .env
```

---

## 📊 Monitoring Scraper Performance

### **Add logging:**
```bash
# Watch logs in real-time
cd /Users/austinstickley/roofsource-pro/backend
npm run scrape 2>&1 | tee scrape.log
```

### **Check database growth:**
```bash
# In another terminal
watch -n 5 'sqlite3 backend/data/products.db "SELECT COUNT(*) FROM products"'
```

---

## 🎯 Next Steps After Testing

1. ✅ **Phase 1 works**: You understand output, database structure
2. ✅ **Database has data**: Check with SQLite commands
3. ✅ **Ready for proxy**: Sign up for SmartProxy ($75)
4. ✅ **Proxy works**: ABC Supply scrapes successfully
5. ✅ **Production**: Run `npm run scrape` daily via cron

---

## 💡 Quick Reference

| Command | What it does |
|---------|-------------|
| `npm run test-scraper` | Test both scrapers (quick) |
| `npm run scrape` | Full production scrape (30 min) |
| `npm run setup-db` | Create/reset database |
| `npm run dev` | Start API server |
| `HEADLESS=false npm run test-scraper` | Show browser window |

---

## 🚀 Ready to Test?

**Start here:**
```bash
cd /Users/austinstickley/roofsource-pro/backend
npm install
npm run test-scraper
```

Then check the database:
```bash
sqlite3 data/products.db "SELECT * FROM products LIMIT 5;"
```

**Questions to answer:**
1. ✅ Did Home Depot scrape work?
2. ✅ Did data save to database?
3. ✅ Can you see the product data?
4. ❌ Did ABC Supply get blocked? (expected)

Let me know what you see!
