
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

// Use dynamic import to ensure env vars are loaded BEFORE mock-db (and firebase-admin) initializes
(async () => {
    const { db } = await import('../mock-db');

    async function testConnection() {
        console.log('Testing Firestore Connection via MockDB Façade...');

        // 1. Create User
        const email = `test_user_${Date.now()}@example.com`;
        console.log(`Creating user: ${email}`);
        const user = await db.users.create({ email, phone: '+15550000000' });
        console.log('User created:', user);

        if (!user.id) throw new Error('User ID missing!');

        // 2. Add Cashback
        console.log(`Adding cashback to user ${user.id}...`);
        const cashback = await db.cashbacks.create(user.id, 50.00);
        console.log('Cashback record:', cashback);

        // 3. Verify Balance Update (should be 50)
        console.log('Verifying user balance...');
        const updatedUser = await db.users.findById(user.id);
        console.log('Updated User:', updatedUser);

        if (updatedUser?.balance !== 50) {
            console.error('FAIL: Balance not updated correctly!');
        } else {
            console.log('SUCCESS: Balance updated correctly.');
        }

        // 4. Verify Transaction History
        console.log('Fetching transaction history...');
        const history = await db.cashbacks.findByUser(user.id);
        console.log(`Found ${history.length} transactions.`);
        
        if (history.length > 0) {
            console.log('API Connection Verified! ✅');
        }
    }

    await testConnection();
})().catch(console.error);
