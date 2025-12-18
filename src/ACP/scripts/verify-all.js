
const VALID_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

async function verify() {
    try {
        // 1. Link Wallet
        console.log('--- 1. Link Wallet ---');
        const linkRes = await fetch('http://localhost:3000/api/linkWallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: VALID_WALLET }),
        });

        if (!linkRes.ok) throw new Error(`Link failed: ${linkRes.status} ${await linkRes.text()}`);
        const linkData = await linkRes.json();
        console.log('✓ Wallet linked. Token:', linkData.session_token);

        // 2. Search Products
        console.log('\n--- 2. Search Products ---');
        const searchRes = await fetch('http://localhost:3000/api/searchProducts?query=headphones', {
            headers: { 'Authorization': `Bearer ${linkData.session_token}` },
        });

        if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status} ${await searchRes.text()}`);
        const searchData = await searchRes.json();
        console.log(`✓ Found ${searchData.results.length} products.`);
        console.log('Sample product:', searchData.results[0].product_name);

        // 3. Get Cashback
        console.log('\n--- 3. Get Cashback ---');
        const cashRes = await fetch('http://localhost:3000/api/getCashback', {
            headers: { 'Authorization': `Bearer ${linkData.session_token}` },
        });

        if (!cashRes.ok) throw new Error(`Cashback failed: ${cashRes.status} ${await cashRes.text()}`);
        const cashData = await cashRes.json();
        console.log('✓ Cashback Summary retrieved.');
        console.log('Total Earned:', cashData.summary.total_earned);
        console.log('Recent Transactions:', cashData.transactions.length);

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
