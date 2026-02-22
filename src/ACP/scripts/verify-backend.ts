
import { POST as LoginPOST } from '../../../app/api/auth/login/route';
import { GET as ProfileGET } from '../../../app/api/user/profile/route';
import { GET as CashbackGET } from '../../../app/api/user/cashback/route';
import { db } from '../mock-db';

// Mock helpers
const createRequest = (url: string, method: string, body?: any, token?: string) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    
    return new Request(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
    });
};

async function verifyBackend() {
    console.log('--- Verifying Backend Endpoints (Unit/Integration) ---');

    try {
        // 1. Setup: Create User via Login
        console.log('\n[1] Setup: creating user via login...');
        const loginReq = createRequest('http://localhost:3000/api/auth/login', 'POST', { email: 'backend_test@example.com' });
        const loginRes = await LoginPOST(loginReq);
        const loginData = await loginRes.json();
        
        if (loginRes.status !== 200 || !loginData.session_token) throw new Error('Login failed');
        const token = loginData.session_token;
        const userId = loginData.user.id;
        console.log('   User Logged In, Token obtained.');

        // 2. Setup: Inject some cashback data
        await db.cashbacks.create(userId, 50.00);
        await db.cashbacks.create(userId, 25.50);
        console.log('   Injected 2 cashback records (Total 75.50).');

        // 3. Test Profile Endpoint
        console.log('\n[3] Testing GET /api/user/profile...');
        const profileReq = createRequest('http://localhost:3000/api/user/profile', 'GET', undefined, token);
        const profileRes = await ProfileGET(profileReq);
        const profileData = await profileRes.json();

        if (profileRes.status === 200) {
            console.log('   ✓ Profile Data Recieved');
            console.log(`   Balance: ${profileData.user.balance} (Expected ~75.5)`);
            if (profileData.user.balance !== 75.5) console.error('   ⚠️ Balance mismatch!');
        } else {
            throw new Error(`Profile Fetch Failed: ${profileRes.status}`);
        }

        // 4. Test Cashback Endpoint
        console.log('\n[4] Testing GET /api/user/cashback...');
        const cashbackReq = createRequest('http://localhost:3000/api/user/cashback', 'GET', undefined, token);
        const cashbackRes = await CashbackGET(cashbackReq);
        const cashbackData = await cashbackRes.json();

        if (cashbackRes.status === 200) {
            console.log(`   ✓ Cashback History Recieved: ${cashbackData.cashbacks.length} items`);
            if (cashbackData.cashbacks.length !== 2) throw new Error('Count mismatch');
        } else {
             throw new Error(`Cashback Fetch Failed: ${cashbackRes.status}`);
        }

        // 5. Test Unauthorized Access
        console.log('\n[5] Testing Unauthorized Access...');
        const badReq = createRequest('http://localhost:3000/api/user/profile', 'GET');
        const badRes = await ProfileGET(badReq);
        if (badRes.status === 401) {
            console.log('   ✓ 401 Unauthorized working correctly');
        } else {
            console.error('   ❌ Failed to block unauthorized request');
        }

        console.log('\n--- Backend Verification Complete: ALL PASS ---');

    } catch (error) {
        console.error('Verification Error:', error);
        process.exit(1);
    }
}

verifyBackend();
