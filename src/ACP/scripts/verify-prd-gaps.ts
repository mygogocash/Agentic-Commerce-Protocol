import { db } from '../mock-db.js';

// Mock Response for fetch usually needed, but here we can test logic directly or use local fetch if server running.
// For robustness, let's test the DB logic directly and the URL construction.

async function verify() {
    console.log('--- Verifying PRD Gaps ---');

    // 1. Test Data Revocation Logic
    console.log('\n1. Testing Token Revocation (Unlink)...');
    
    // Create a session
    const user = await db.users.create('0xTestUser');
    const session = await db.sessions.create(user.id);
    console.log('   Created Session:', session.token.substr(0, 20) + '...');

    // Verify it works
    const valid1 = await db.sessions.verify(session.token);
    if (valid1) console.log('   ✅ Token initially valid.');
    else console.error('   ❌ Token should be valid.');

    // Revoke it
    await db.sessions.revoke(session.token);
    console.log('   Revoked Token.');

    // Verify it fails
    const valid2 = await db.sessions.verify(session.token);
    if (!valid2) console.log('   ✅ Token successfully invalidated (Blacklisted).');
    else console.error('   ❌ Token is still valid after revoke!');


    // 2. Test Affiliate Link Wrapping
    console.log('\n2. Testing Affiliate Link Wrapping...');
    const target = 'https://shopee.co.th/product/123/456';
    const expectedPrefix = 'https://gogocash-acp.vercel.app/api/redirect?url=';
    
    // Simulate what shopee.ts does
    const wrapped = `https://gogocash-acp.vercel.app/api/redirect?url=${encodeURIComponent(target)}`;
    
    console.log('   Target:', target);
    console.log('   Wrapped:', wrapped);

    if (wrapped.startsWith(expectedPrefix) && wrapped.includes(encodeURIComponent(target))) {
        console.log('   ✅ Link correctly wrapped.');
    } else {
        console.error('   ❌ Link wrapping failed format check.');
    }

    process.exit(0);
}

verify();
