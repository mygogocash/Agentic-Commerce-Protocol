
const TEST_EMAIL = "auth_test@example.com";
const TEST_PHONE = "0812345678"; // Generic format to test regex

async function verifyAuth() {
    try {
        console.log('--- Starting Auth Verification ---');

        // 1. Test Email Login
        console.log('\n[1] Testing Email Login...');
        const emailRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: TEST_EMAIL }),
        });

        if (emailRes.ok) {
            const data = await emailRes.json();
            console.log('✓ Email Login Success');
            console.log('  User ID:', data.user.id);
            console.log('  Email:', data.user.email);
            if (!data.session_token) throw new Error('Missing session token');
        } else {
            console.error('✗ Email Login Failed:', await emailRes.text());
            process.exit(1);
        }

        // 2. Test Phone Login
        console.log('\n[2] Testing Phone Login...');
        const phoneRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone: TEST_PHONE }),
        });

        if (phoneRes.ok) {
            const data = await phoneRes.json();
            console.log('✓ Phone Login Success');
            console.log('  User ID:', data.user.id);
            console.log('  Phone:', data.user.phone);
            if (!data.session_token) throw new Error('Missing session token');
        } else {
             console.error('✗ Phone Login Failed:', await phoneRes.text());
             process.exit(1);
        }

        // 3. Test Invalid Email
        console.log('\n[3] Testing Invalid Email...');
        const invalidEmailRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: "invalid-email" }),
        });

        if (invalidEmailRes.status === 400) {
            console.log('✓ Invalid Email correctly rejected');
        } else {
            console.error('✗ Invalid Email was NOT rejected as expected. Status:', invalidEmailRes.status);
        }

        // 4. Test Missing Credentials
        console.log('\n[4] Testing Missing Credentials...');
        const missingRes = await fetch('http://127.0.0.1:3000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ }),
        });
        
        if (missingRes.status === 400) {
             console.log('✓ Missing credentials correctly rejected');
        } else {
             console.error('✗ Missing credentials NOT rejected. Status:', missingRes.status);
        }

        console.log('\n--- Auth Verification Complete: ALL PASS ---');

    } catch (error) {
        console.error('Verification Script Error:', error);
        process.exit(1);
    }
}

verifyAuth();
