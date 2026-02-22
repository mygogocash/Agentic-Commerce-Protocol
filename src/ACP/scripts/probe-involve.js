
// Native fetch is available in Node.js v18+

const API_KEY = 'general';
const API_SECRET = 'o1pW16U54vPeK91Yut/SZHRVpuMqo8L5VTRQxjtD7iM=';


async function probe() {
    console.log('Probing Involve Asia API Auth & Offers...');
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
        console.log('Token received.');


        // 3. Generate Deep Link
        console.log('Generating Deep Link...');
        const linkRes = await fetch('https://api.involve.asia/api/deeplink/generate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                website_url: 'https://shopee.com.my/search?keyword=headphones'
            })
        });

        console.log(`Link Status: ${linkRes.status}`);
        const linkText = await linkRes.text();
        console.log(`Link Body: ${linkText}`);


        // 2. Get Offers (Merchants)
        // "Best to use this API once a week" - implies it's a heavy list.
        const offersRes = await fetch('https://api.involve.asia/api/offers/all', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                // Assuming no filters needed for first try, or minimal pagination
                page: 1,
            })
        });


        console.log(`Offers Status: ${offersRes.status}`);
        const offersData = await offersRes.json();
        if (offersData.data && offersData.data.data && offersData.data.data.length > 0) {
            console.log('First Offer:', JSON.stringify(offersData.data.data[0], null, 2));
        } else {
            console.log('No offers found or invalid structure.');
        }


    } catch (err) {
        console.error('Error:', err);
    }
}

probe();
