
// Native fetch is available in Node.js v18+

const API_KEY = 'general';
const API_SECRET = 'o1pW16U54vPeK91Yut/SZHRVpuMqo8L5VTRQxjtD7iM=';

async function probeLink() {
    console.log('Probing Deep Link Generation...');
    try {
        // 1. Auth
        const params = new URLSearchParams();
        params.append('key', API_KEY);
        params.append('secret', API_SECRET);

        const authRes = await fetch('https://api.involve.asia/api/authenticate', {
            method: 'POST',
            body: params
        });

        const authData = await authRes.json();
        if (authData.status !== 'success') {
            console.error('Auth failed:', authData);
            return;
        }
        const token = authData.data.token;
        console.log('Auth Success. Token obtained.');


        // 2. Get Offers to find a valid one
        console.log('Fetching Offers...');
        const offersRes = await fetch('https://api.involve.asia/api/offers/all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ page: 1 })
        });

        const offersData = await offersRes.json();
        const offers = offersData.data?.data || [];
        console.log(`Found ${offers.length} offers.`);

        // Log first 5
        offers.slice(0, 5).forEach((o, i) => {
            console.log(`[${i}] ${o.offer_name} | URL: ${o.preview_url}`);
        });

        if (offers.length > 0) {
            // Try deep linking to the second one (first was referral)
            // Or find one that looks like a shop
            const target = offers.find(o => o.offer_name.includes('Shop') || o.offer_name.includes('Store')) || offers[1] || offers[0];
            const targetUrl = target.preview_url;

            console.log(`\nAttempting Deep Link for: ${target.offer_name} (${targetUrl})`);

            const linkRes = await fetch('https://api.involve.asia/api/deeplink/generate', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    website_url: targetUrl
                })
            });

            console.log(`Link Status: ${linkRes.status}`);
            const linkBody = await linkRes.text();
            console.log(`Link Body: ${linkBody}`);
        }


    } catch (err) {
        console.error('Error:', err);
    }
}

probeLink();
