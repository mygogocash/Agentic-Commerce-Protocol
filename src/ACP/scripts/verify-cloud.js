
const VALID_WALLET = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
const TARGET_URL = process.argv[2] || process.env.TARGET_URL || "https://gogocash-acp.vercel.app";

async function verify() {
    try {
        console.log(`--- GogoCash Cloud Verification [Target: ${TARGET_URL}] ---`);
        
        // --- 1. SEARCH/LEGACY CHECK ---
        // (This might fail if DB is empty, but shouldn't crash script)
        console.log('\n[1] Verify Legacy Search (Optional)...');
        // Get temp token via wallet
        const linkRes = await fetch(`${TARGET_URL}/api/linkWallet`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ wallet_address: VALID_WALLET }),
        });
        
        if (linkRes.ok) {
            const linkData = await linkRes.json();
            const token = linkData.session_token;
            console.log('   ✓ Wallet Link Success');
            
            const searchRes = await fetch(`${TARGET_URL}/api/searchProducts?query=shirt`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });
            
            if (searchRes.ok) {
                const searchData = await searchRes.json();
                console.log(`   ✓ Search Endpoint Reachable. Results: ${searchData.results.length}`);
            } else {
                 console.log(`   ⚠️ Search Endpoint Error: ${searchRes.status}`);
            }
        } else {
            console.log(`   ⚠️ Wallet Link Failed: ${linkRes.status}`);
        }

        // --- 2. NEW AUTH & BACKEND CHECK ---
        console.log('\n[2] Verify New Auth & Backend (Critical)...');
        
        // Login with Email
        console.log('   2a. Testing Email Login...');
        const authRes = await fetch(`${TARGET_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "cloud_test@gogocash.com" })
        });
        
        if (!authRes.ok) throw new Error(`Auth Failed: ${authRes.status}`);
        const authData = await authRes.json();
        const authToken = authData.session_token;
        console.log('   ✅ Login Successful');

        // Fetch Profile
        console.log('   2b. Testing Profile Fetch...');
        const profileRes = await fetch(`${TARGET_URL}/api/user/profile`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        
        if (!profileRes.ok) throw new Error(`Profile Fetch Failed: ${profileRes.status}`);
        const profileData = await profileRes.json();
        console.log(`   ✅ Profile Fetched. Balance: ${profileData.user.balance}`);
        console.log(`   ✅ ID: ${profileData.user.id}`);

        // Fetch Cashback
        console.log('   2c. Testing Cashback History...');
        const cbRes = await fetch(`${TARGET_URL}/api/user/cashback`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        if (!cbRes.ok) throw new Error(`Cashback Fetch Failed: ${cbRes.status}`);
        const cbData = await cbRes.json();
        console.log(`   ✅ Cashback History Fetched: ${cbData.cashbacks.length} items (New users start with 0)`);

        console.log('\n✅✅✅ VERIFICATION COMPLETE: AUTH & BACKEND OPERATIONAL ✅✅✅');

    } catch (error) {
        console.error('\n❌ Verification failed:', error);
        process.exit(1);
    }
}

verify();
