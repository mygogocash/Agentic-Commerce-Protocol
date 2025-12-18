
const VALID_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

async function verify() {
    try {
        // 1. Link Wallet
        console.log('Linking wallet...');
        const linkRes = await fetch('http://localhost:3000/api/linkWallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: VALID_WALLET }),
        });

        if (!linkRes.ok) throw new Error(`Link failed: ${linkRes.status} ${await linkRes.text()}`);
        const linkData = await linkRes.json();
        console.log('Wallet linked. Token:', linkData.session_token);

        // 2. Search Products
        console.log('Searching products...');
        const searchRes = await fetch('http://localhost:3000/api/searchProducts?query=headphones', {
            headers: { 'Authorization': `Bearer ${linkData.session_token}` },
        });

        if (!searchRes.ok) throw new Error(`Search failed: ${searchRes.status} ${await searchRes.text()}`);
        const searchData = await searchRes.json();
        console.log('Search results found:', searchData.results.length);
        console.log('First result:', JSON.stringify(searchData.results[0], null, 2));

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
