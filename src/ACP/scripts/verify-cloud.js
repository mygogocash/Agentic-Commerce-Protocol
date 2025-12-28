const VALID_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const TARGET_URL = process.argv[2] || process.env.TARGET_URL || "https://gogocash-acp.vercel.app";

async function verify() {
    try {
        console.log(`--- Shopee Cloud Integration Verification [Target: ${TARGET_URL}] ---`);
        
        // 1. Link Wallet
        const linkRes = await fetch(`${TARGET_URL}/api/linkWallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: VALID_WALLET }),
        });
        const linkData = await linkRes.json();
        const token = linkData.session_token;

        // 2. Search
        const query = 'shirt'; 
        console.log(`Searching for: "${query}"`);

        const res = await fetch(`${TARGET_URL}/api/searchProducts?query=${query}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!res.ok) throw new Error(`Search failed: ${res.status}`);
        const data = await res.json();
        
        console.log(`Found ${data.results.length} results.`);
        
        const cloudItems = data.results.filter(p => p.product_id && p.product_id.startsWith('shp_cloud_'));
        
        if (cloudItems.length > 0) {
            console.log('✅ SUCCESS: Found items from Cloud Database!');
            const item = cloudItems[0];
            console.log(`Sample: ${item.product_name} (${item.product_id})`);
            console.log(`Price: THB ${item.product_price} / USD ${item.product_price_usd}`);
            if (!item.product_price_usd) console.warn('⚠️  Warning: USD Price missing!');
        } else {
            console.log('⚠️  Note: Items returning provided by Local Fallback (or migration not ready yet).');
            const shopeeItems = data.results.filter(p => p.merchant_name === 'Shopee');
            if (shopeeItems.length > 0) {
                 const item = shopeeItems[0];
                 console.log(`Sample Local Item: ${item.product_id}`);
                 console.log(`Price: THB ${item.product_price} / USD ${item.product_price_usd}`);
            }
        }

    } catch (error) {
        console.error('Verification failed:', error);
    }
}

verify();
