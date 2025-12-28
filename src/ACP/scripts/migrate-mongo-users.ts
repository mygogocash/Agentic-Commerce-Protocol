
import { MongoClient } from 'mongodb';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });

const MONGODB_URI = process.env.MONGODB_MIGRATION_URI;
// Using the same Access Token as upload script (valid for ~1 hour from generation)
// If this fails with 401, we need a new token or Service Account
const ACCESS_TOKEN = process.env.TEMP_ACCESS_TOKEN || "PLACEHOLDER_TOKEN_FOR_LOCAL_RUN";
const PROJECT_ID = 'gogocash-acp';

async function migrateUsers() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_MIGRATION_URI is missing in .env.local');
        console.error('Please add it: MONGODB_MIGRATION_URI="mongodb+srv://gogocash:<PASSWORD>@gogocash.4prpd9j.mongodb.net/?appName=gogocash"');
        process.exit(1);
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('gogocash'); // Assuming DB name from URI
        const usersCol = db.collection('users');
        const cashbackCol = db.collection('usermycashbacks'); // Verify collection name

        const users = await usersCol.find({}).toArray();
        console.log(`Found ${users.length} users to migrate.`);

        // Migrate Users
        let successCount = 0;
        let batch = [];
        
        for (const user of users) {
             const docId = user._id.toString();
             
             // Map Mongo User to Firestore Fields
             const fields: any = {
                 email: { stringValue: user.email || '' },
                 phone: { stringValue: user.phone || '' },
                 balance: { doubleValue: user.balance ? parseFloat(user.balance) : 0 },
                 go_points: { integerValue: user.go_points ? parseInt(user.go_points) : 0 },
                 previous_mongo_id: { stringValue: docId },
                 migrated_at: { timestampValue: new Date().toISOString() }
             };
             // Add other fields as needed

             batch.push({
                 update: {
                     name: `projects/${PROJECT_ID}/databases/(default)/documents/users/${docId}`,
                     fields: fields
                 }
             });

             if (batch.length >= 20) {
                 await commitBatch(batch);
                 successCount += batch.length;
                 process.stdout.write(`\rMigrated Users: ${successCount}`);
                 batch = [];
             }
        }
        if (batch.length > 0) await commitBatch(batch);
        console.log(`\n✅ User Migration Complete: ${successCount} users.`);

        // Migrate Cashbacks
        console.log('Migrating Cashback History...');
        batch = [];
        successCount = 0;
        const cashbacks = await cashbackCol.find({}).toArray();
        console.log(`Found ${cashbacks.length} transactions.`);

        for (const cb of cashbacks) {
            const docId = cb._id.toString();
            // Assuming cb.userId matches the user's _id string
            
            const fields: any = {
                userId: { stringValue: cb.userId ? cb.userId.toString() : '' },
                amount: { doubleValue: cb.cashback_amount ? parseFloat(cb.cashback_amount) : 0 },
                status: { stringValue: cb.status || 'pending' },
                description: { stringValue: 'Migrated from MongoDB' },
                createdAt: { timestampValue: cb.created_at ? new Date(cb.created_at).toISOString() : new Date().toISOString() }
            };

            batch.push({
                 update: {
                     name: `projects/${PROJECT_ID}/databases/(default)/documents/cashback_transactions/${docId}`,
                     fields: fields
                 }
            });

             if (batch.length >= 20) {
                 await commitBatch(batch);
                 successCount += batch.length;
                 process.stdout.write(`\rMigrated Txns: ${successCount}`);
                 batch = [];
             }
        }
        if (batch.length > 0) await commitBatch(batch);
        console.log(`\n✅ Transaction Migration Complete: ${successCount} txns.`);

    } catch (e) {
        console.error('Migration Failed:', e);
    } finally {
        await client.close();
    }
}

async function commitBatch(writes: any[]) {
    const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:batchWrite`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${ACCESS_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ writes })
    });

    if (!response.ok) {
        // Log quota errors but don't crash
        const text = await response.text();
        console.error(`\nBatch Write Failed: ${response.status} - ${text.substring(0, 100)}...`);
    }
}

migrateUsers().catch(console.error);
