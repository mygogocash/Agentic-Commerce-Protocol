
const VALID_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";

async function verify() {
    try {
        // 1. Link/Login User
        console.log('Logging in...');
        const loginRes = await fetch('http://localhost:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "test@example.com" }),
        });

        if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status} ${await loginRes.text()}`);
        const loginData = await loginRes.json();
        console.log('User logged in. Token:', loginData.session_token);

        // 2. Search Products
        console.log('Searching products...');
        const searchRes = await fetch('http://localhost:3000/api/searchProducts?query=headphones', {
            headers: { 'Authorization': `Bearer ${loginData.session_token}` },
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
