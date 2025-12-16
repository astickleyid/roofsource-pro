/**
 * Main scraping job orchestrator
 */
import { setupDatabase, insertScrapeJob, updateScrapeJob } from '../database/db.js';
import ABCSupplyScraper from '../scrapers/abcSupply.js';
import HomeDepotScraper from '../scrapers/homeDepot.js';

async function runAllScrapers() {
  console.log('🚀 Starting scraping job...\n');
  
  // Setup database
  await setupDatabase();

  const results = {
    total: 0,
    bySupplier: {}
  };

  // ABC Supply
  console.log('📦 Scraping ABC Supply...');
  const abcJobId = await insertScrapeJob('ABC Supply', 'running');
  try {
    const abcScraper = new ABCSupplyScraper();
    await abcScraper.init();
    const count = await abcScraper.scrapeAllCategories();
    await abcScraper.close();
    
    await updateScrapeJob('completed', count, null, abcJobId);
    results.bySupplier['ABC Supply'] = count;
    results.total += count;
  } catch (error) {
    await updateScrapeJob('failed', 0, error.message, abcJobId);
    console.error('ABC Supply failed:', error.message);
  }

  // Home Depot
  console.log('\n🏠 Scraping Home Depot...');
  const hdJobId = await insertScrapeJob('Home Depot Pro', 'running');
  try {
    const hdScraper = new HomeDepotScraper();
    const count = await hdScraper.scrapeCommonProducts();
    
    await updateScrapeJob('completed', count, null, hdJobId);
    results.bySupplier['Home Depot'] = count;
    results.total += count;
  } catch (error) {
    await updateScrapeJob('failed', 0, error.message, hdJobId);
    console.error('Home Depot failed:', error.message);
  }

  // TODO: Add more scrapers
  // - Beacon
  // - SRS Distribution
  // - Local suppliers

  console.log('\n✅ Scraping complete!');
  console.log(`📊 Total products: ${results.total}`);
  console.log('By supplier:', results.bySupplier);
  
  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllScrapers()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default runAllScrapers;
