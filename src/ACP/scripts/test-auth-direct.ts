
import { POST } from '../../app/api/auth/login/route';
import { db } from '../mock-db';
import { NextResponse } from 'next/server';

// Mock Request if needed globally or just use standard Request
// Mock NextResponse if not available in node context (usually available in recent node, but next/server might rely on edge)

async function testAuthLogic() {
    // Verification:
    console.log('--- Testing Auth Logic Directly ---');

    // Helper to mock request
    const createRequest = (body: any) => {
        return new Request('http://localhost:3000/api/auth/login', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    };

    try {
        // 1. Test Email Login
        console.log('\n[1] Testing Email Login...');
        const emailReq = createRequest({ email: "direct_test@example.com" });
        const emailRes = await POST(emailReq);
        const emailData = await emailRes.json();
        
        if (emailRes.status === 200 && emailData.session_token) {
            console.log('✓ Email Login Success');
            console.log('  User:', emailData.user);
        } else {
            console.error('✗ Email Login Failed:', emailData);
            process.exit(1);
        }

        // 2. Test Phone Login
        console.log('\n[2] Testing Phone Login...');
        const phoneReq = createRequest({ phone: "0899999999" });
        const phoneRes = await POST(phoneReq);
        const phoneData = await phoneRes.json();

        if (phoneRes.status === 200 && phoneData.session_token) {
             console.log('✓ Phone Login Success');
             console.log('  User:', phoneData.user);
        } else {
             console.error('✗ Phone Login Failed:', phoneData);
             process.exit(1);
        }

        // Verify DB State
        console.log('\n[3] Verifying DB State...');
        const user = await db.users.findByEmail('direct_test@example.com');
        if (user && user.balance === 0 && user.go_points === 100) {
            console.log('✓ DB State Correct (Balance=0, Points=100)');
        } else {
            console.error('✗ DB State Incorrect:', user);
            process.exit(1);
        }

        console.log('\n--- Direct Auth Test Complete: ALL PASS ---');

    } catch (error) {
        console.error('Test Error:', error);
        process.exit(1);
    }
}

testAuthLogic();
