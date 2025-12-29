
const API_KEY = 'general';
const API_SECRET = process.env.INVOLVE_API_SECRET || '';

async function probeShopee() {
    console.log('Probing Shopee Commission Xtra...');
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
        console.log('Auth Success.');

        // 2. Fetch Shopee Xtra
        console.log('Fetching Xtra Offers...');
        const xtraRes = await fetch('https://api.involve.asia/api/shopeextra/all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                page: 1,
                country: 'Malaysia', // Default to Malaysia as seen in docs example
                sort: 'high_commission'
            })
        });


        console.log(`Status: ${xtraRes.status}`);
        const data = await xtraRes.json();
        if (data.data && data.data.data && data.data.data.length > 0) {
            console.log('First Xtra Result:', JSON.stringify(data.data.data[0], null, 2));
        } else {
            console.log('No data found:', data);
        }


    } catch (err) {
        console.error('Error:', err);
    }
}

probeShopee();
