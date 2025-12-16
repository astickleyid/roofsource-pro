# Proxy & CAPTCHA Setup Guide

## Overview

To scrape supplier websites at scale, you need:
1. **Proxy rotation** - Avoid IP bans
2. **CAPTCHA solving** - Bypass bot detection

## Quick Setup

### 1. Choose a Proxy Service

#### Option A: Bright Data (Recommended - Most reliable)
- Sign up: https://brightdata.com
- Cost: ~$500/month for residential proxies
- Best success rate, rotate automatically

```bash
# Add to backend/.env
PROXY_HOST=brd.superproxy.io
PROXY_PORT=22225
PROXY_USERNAME=your-brightdata-username
PROXY_PASSWORD=your-brightdata-password
```

#### Option B: SmartProxy (Good balance)
- Sign up: https://smartproxy.com
- Cost: ~$75/month (40GB)
- Good for medium scraping

```bash
# Add to backend/.env
PROXY_HOST=gate.smartproxy.com
PROXY_PORT=7000
PROXY_USERNAME=your-smartproxy-username
PROXY_PASSWORD=your-smartproxy-password
```

#### Option C: Oxylabs (Enterprise)
- Sign up: https://oxylabs.io
- Cost: ~$300/month
- Very reliable, great for heavy scraping

```bash
# Add to backend/.env
PROXY_HOST=pr.oxylabs.io
PROXY_PORT=7777
PROXY_USERNAME=your-oxylabs-username
PROXY_PASSWORD=your-oxylabs-password
```

### 2. Setup CAPTCHA Solving

#### 2Captcha (Recommended)
- Sign up: https://2captcha.com
- Cost: $2.99 per 1000 CAPTCHAs
- Works with reCAPTCHA v2 & v3

```bash
# Add to backend/.env
CAPTCHA_API_KEY=your-2captcha-api-key
```

**How to get API key:**
1. Register at https://2captcha.com
2. Go to Dashboard
3. Copy your API key
4. Add to `.env`

## Installation

```bash
cd backend
npm install puppeteer-extra puppeteer-extra-plugin-stealth puppeteer-extra-plugin-recaptcha
```

Already done! The packages are in package.json.

## Usage

### Test Enhanced Scrapers

```bash
cd backend

# Copy example env
cp .env.example .env

# Edit .env and add your credentials
nano .env

# Run enhanced scraper
node -e "import('./src/scrapers/abcSupplyEnhanced.js').then(m => { const s = new m.default(); s.init().then(() => s.scrapeAllCategories()).then(c => { console.log('Scraped:', c); s.close(); }); })"
```

## How It Works

### Proxy Rotation
```javascript
// Automatically rotates through proxy pool
const proxy = proxyManager.getProxy();
// Each request uses different IP
```

### CAPTCHA Solving
```javascript
// Detects CAPTCHA automatically
const hasCaptcha = await page.$('.g-recaptcha');
if (hasCaptcha) {
  // Sends to 2Captcha, waits for solution, submits
  await page.solveRecaptchas();
}
```

### Anti-Detection Features
- ✅ Stealth mode (hides automation flags)
- ✅ Random user agents
- ✅ Human-like delays (1-3 seconds)
- ✅ Realistic viewport sizes
- ✅ Removes webdriver flag
- ✅ Browser fingerprint randomization

## Cost Breakdown

### Minimal Setup ($10/month)
- SmartProxy: $75/month (40GB) - but starts with free trial
- 2Captcha: ~$5/month (1,500 CAPTCHAs)
- **Total: ~$80/month**

### Recommended Setup ($200/month)
- Bright Data: $500/month BUT you can start with pay-as-you-go
- 2Captcha: ~$10/month
- **Total: Start with $10, scale as needed**

### Alternative: DIY Free (Not Recommended)
- Free proxy lists (slow, unreliable, 90% blocked)
- Manual CAPTCHA solving
- **Total: $0 but you'll waste hours debugging**

## Testing Without Paid Services

For development/testing, the scrapers will:
1. Try without proxy (will get blocked after ~10 requests)
2. Show warnings in console
3. Still work for small tests

```bash
# Test mode (no proxy needed for small batches)
HEADLESS=false node src/scrapers/abcSupplyEnhanced.js
```

## Production Recommendations

1. **Start small:** Use SmartProxy free trial
2. **Test thoroughly:** Scrape 100 products to verify
3. **Scale up:** Switch to Bright Data for 10,000+ products
4. **Monitor:** Check scrape_jobs table for success rate

## Security Notes

⚠️ **Never commit `.env` to git!**
- `.env` is already in `.gitignore`
- Share credentials securely (1Password, etc.)

⚠️ **Respect robots.txt**
- We add delays between requests
- Don't scrape faster than 1 req/second
- This is for legitimate price comparison

## Troubleshooting

### "No proxy configured" warning
→ Add proxy credentials to `.env`

### "CAPTCHA solving failed"
→ Check 2Captcha balance
→ Verify API key is correct

### "403 Forbidden" errors
→ Proxy is blocked, rotate to different service
→ Try residential proxies instead of datacenter

### High costs
→ Cache results in database (already implemented)
→ Only scrape once per day (cron job at 2 AM)
→ Start with smaller product catalog

## Next Steps

1. Sign up for SmartProxy free trial
2. Sign up for 2Captcha
3. Add credentials to `backend/.env`
4. Run: `npm run scrape`
5. Check results in database

**You'll go from 0 products to 1000+ products in one run.** 🚀
