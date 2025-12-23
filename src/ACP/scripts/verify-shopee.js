const VALID_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

async function verify() {
    try {
        console.log('--- Shopee Integration Verification ---');
        
        // 1. Link Wallet
        const linkRes = await fetch('http://localhost:3000/api/linkWallet', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: VALID_WALLET }),
        });
        const linkData = await linkRes.json();
        const token = linkData.session_token;

        // 2. Search for a term that should be in Shopee (from our subset)
        // I saw "Baby & Kids Fashion" or "Garmin" in the CSV snippet. Let's try "Garmin" or "Baby"
        const query = 'shirt'; 
        console.log(`Searching for: "${query}"`);

        const res = await fetch(`http://localhost:3000/api/searchProducts?query=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        
        console.log(`Found ${data.results.length} results.`);
        
        const shopeeItems = data.results.filter(p => p.merchant_name === 'Shopee');
        console.log(`Shopee Items: ${shopeeItems.length}`);
        
        if (shopeeItems.length > 0) {
            console.log('Sample Shopee Item:', shopeeItems[0].product_name);
            console.log('Price:', shopeeItems[0].product_price);
        } else {
            console.warn('WARNING: No Shopee items found. The subset might not contain "shirt" or the service failed.');
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
