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

        // 2. Get Christmas Gifts
        console.log('\n--- 2. Get Christmas Gifts ---');
        const searchRes = await fetch('http://localhost:3000/api/getChristmasGifts?recipient=mom&budget=100', {
            headers: { 'Authorization': `Bearer ${linkData.session_token}` },
        });

        if (!searchRes.ok) throw new Error(`Christmas Gift Search failed: ${searchRes.status} ${await searchRes.text()}`);
        const searchData = await searchRes.json();
        console.log(`✓ Found ${searchData.results.length} gift ideas.`);
        if (searchData.results.length > 0) {
            console.log('Sample gift:', searchData.results[0].product_name);
            console.log('Query used:', searchData.query);
        } else {
            console.log('No results found (unexpected for mock data).');
        }

    } catch (error) {
        console.error('Verification failed:', error);
        process.exit(1);
    }
}

verify();
