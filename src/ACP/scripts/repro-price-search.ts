import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function repro() {
    // Dynamic import to ensure ENV is loaded first
    const { shopeeService } = await import('../shopee.js');

    console.log('--- Reproduction: "headphones under $300" ---');
    
    // Test 1: Price Parsing
    const query = "gadget gift ideas under $50";
    console.log(`\nSearching for: "${query}"`);

    const results = await shopeeService.search(query);
    console.log(`Found ${results.length} results.`);

    if (results.length > 0) {
        console.log('✅ Success: Search found results!');
        const p = results[0];
        console.log(`   Product: ${p.product_name}`);
        console.log(`   Price: $${p.product_price_usd}`);
        if (p.product_price_usd && p.product_price_usd <= 300) {
             console.log('   ✅ Price constraint respected.');
        } else {
             console.log('   ❌ Price constraint VIOLATED.');
        }
    } else {
        console.log('❌ Failure: Still 0 results.');
    }

    process.exit(0);
}

repro();
