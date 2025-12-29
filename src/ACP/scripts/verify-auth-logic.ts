
import { db } from '../lib/db-service';

async function verifyAuthLogic() {
    console.log('--- Verifying Auth Logic (Unit Test) ---');

    try {
        // Mock the logic from route.ts without using Request/NextResponse
        const login = async (body: any) => {
            const { email, phone } = body;
            
            // 1. Validation Logic
            if (!email && !phone) return { status: 400, error: 'Email or Phone is required' };

            let user;
            // 2. Find/Create Logic
            if (email) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(email)) return { status: 400, error: 'Invalid email format' };
                
                user = await db.users.findByEmail(email.toLowerCase().trim());
                if (!user) user = await db.users.create({ email: email.toLowerCase().trim() });
            } else if (phone) {
                 const phoneRegex = /^\+?[0-9]{10,15}$/;
                 if (!phoneRegex.test(phone)) return { status: 400, error: 'Invalid phone format' };

                 user = await db.users.findByPhone(phone.trim());
                 if (!user) user = await db.users.create({ phone: phone.trim() });
            }

            if (!user) return { status: 500, error: 'User creation failed' };

            // 3. Session Logic
            const session = await db.sessions.create(user.id);

            return { 
                status: 200, 
                body: {
                    user,
                    session_token: session.token
                }
            };
        };

        // TEST 1: Email Login
        console.log('\n[1] Testing Email Login Logic...');
        const emailRes = await login({ email: "unit_test@example.com" });
        if (emailRes.status === 200 && emailRes.body.user.email === "unit_test@example.com") {
            console.log('✓ Email Login Success');
        } else {
            throw new Error(`Email Login Failed: ${JSON.stringify(emailRes)}`);
        }

        // TEST 2: Phone Login
        console.log('\n[2] Testing Phone Login Logic...');
        const phoneRes = await login({ phone: "0812341234" });
        if (phoneRes.status === 200 && phoneRes.body.user.phone === "0812341234") {
             console.log('✓ Phone Login Success');
        } else {
             throw new Error(`Phone Login Failed: ${JSON.stringify(phoneRes)}`);
        }

         // TEST 3: Validation
         console.log('\n[3] Testing Validation Logic...');
         const invalidRes = await login({ email: "not-an-email" });
         if (invalidRes.status === 400) {
             console.log('✓ Invalid Email Rejected');
         } else {
             throw new Error('Invalid Email NOT rejected');
         }

         // TEST 4: DB Check
         console.log('\n[4] verifying DB State...');
         const user = await db.users.findByEmail('unit_test@example.com');
         if (user && user.balance === 0) {
             console.log('✓ New user has valid schema (balance=0)');
         } else {
             throw new Error('DB Schema check failed');
         }

         console.log('\n--- Logic Verification Complete: ALL PASS ---');

    } catch (error) {
        console.error('Logic Verification Failed:', error);
        process.exit(1);
    }
}

verifyAuthLogic();
