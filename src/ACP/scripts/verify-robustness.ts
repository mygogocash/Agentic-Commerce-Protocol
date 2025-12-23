import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function verify() {
    // Dynamic import to ensure ENV is loaded first
    const { shopeeService } = await import('../shopee.js');

    console.log('--- Shopee Robustness Verification ---');
    
    // 1. Normal Search
    console.log('\n1. Searching for "Headphones"...');
    const res1 = await shopeeService.search('Headphones');
    console.log(`Found ${res1.length} results.`);
    if (res1.length > 0) console.log(`Example: ${res1[0].product_name}`);

    // 2. Special Characters (Known to break to_tsquery if not handled)
    console.log('\n2. Searching for "Black & Decker" (Special Char &)...');
    try {
        const res2 = await shopeeService.search('Black & Decker');
        console.log(`Found ${res2.length} results.`);
        console.log('✅ Success: Search did not crash.');
    } catch (e) {
        console.error('❌ Failed: Search crashed with special char.', e);
    }

    // 3. Complex Query
    console.log('\n3. Searching for "shoes -red" (Negation)...');
    const res3 = await shopeeService.search('shoes -red');
    console.log(`Found ${res3.length} results.`);

    process.exit(0);
}

verify();
