
import { shopeeService } from '../shopee';
import dotenv from 'dotenv';
import path from 'path';

// Force load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function testSearch() {
  console.log('🧪 Testing Shopee MongoDB Search...');
  
  if (!process.env.MONGODB_URI) {
    console.error('❌ MONGODB_URI missing from env');
    process.exit(1);
  }

  // Test cases
  const queries = [
    'iphone',
    'samsung under 5000',
    'laptop over 20000',
    'gift ideas for mom' // Test cleaner
  ];

  for (const query of queries) {
    console.log(`\n🔎 Searching for: "${query}"`);
    const start = Date.now();
    const results = await shopeeService.search(query);
    const duration = Date.now() - start;

    console.log(`   Found ${results.length} results in ${duration}ms`);
    
    if (results.length > 0) {
      console.log(`   Top result: ${results[0].product_name}`);
      console.log(`   Price: ${results[0].product_price} ${results[0].currency}`);
      console.log(`   Link: ${results[0].affiliate_link}`);
    } else {
      console.log('   ⚠️ No results found');
    }
  }

  // Force exit to close DB connection
  process.exit(0);
}

testSearch();
