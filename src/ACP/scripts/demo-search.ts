import { db } from '../lib/db-service.js';
import { shopeeService } from '../shopee.js';

async function demo() {
    console.log('--- Demo: Find me headphones ---');

    console.log('1. User says: "Link my wallet 0xDemoUser"');
    const user = await db.users.create({ wallet_address: '0xDemoUser' });
    const session = await db.sessions.create(user.id);
    console.log(`   Agent: "Linked! Session Token: ${session.token.substring(0, 10)}..."`);

    console.log('\n2. User says: "Find me headphones"');
    console.log('   Agent: Searching...');
    
    // We call the service directly to test the logic, simulating the API handler
    const results = await shopeeService.search('headphones');

    console.log(`   Found ${results.length} results.\n`);

    if (results.length > 0) {
        const p = results[0];
        console.log('   [Top Result]');
        console.log(`   Name: ${p.product_name}`);
        console.log(`   Price: ${p.product_price} THB (~$${p.product_price_usd} USD)`);
        console.log(`   Link: ${p.affiliate_link}`);
        
        if (p.affiliate_link.includes('gogocash-acp')) {
             console.log('   ✅ Valid "Buy Now" Link (Wrapped)');
        }
    } else {
        console.log('   ❌ No results found.');
    }

    process.exit(0);
}

demo();
