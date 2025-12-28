
const { MongoClient } = require('mongodb');
const path = require('path');
const fs = require('fs');

// Load env vars manually or via dotenv
require('dotenv').config({ path: path.resolve(__dirname, '../../../.env.local') });

const MONGODB_URI = process.env.MONGODB_MIGRATION_URI;
// UPDATED TOKEN FROM CONTEXT
const ACCESS_TOKEN = process.env.TEMP_ACCESS_TOKEN || "PLACEHOLDER_TOKEN_FOR_LOCAL_RUN";
const PROJECT_ID = 'gogocash-acp';

async function migrateUsers() {
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_MIGRATION_URI is missing in .env.local');
        return;
    }

    console.log('Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    
    try {
        await client.connect();
        const db = client.db('gogocash');
        const usersCol = db.collection('users');
        const cashbackCol = db.collection('usermycashbacks');

        const users = await usersCol.find({}).toArray();
        console.log(`Found ${users.length} users to migrate.`);

        // Migrate Users
        let successCount = 0;
        let batch = [];
        
        for (const user of users) {
             const docId = user._id.toString();
             
             // Map Mongo User to Firestore Fields
             const fields = {
                 email: { stringValue: user.email || '' },
                 phone: { stringValue: user.phone || '' },
                 balance: { doubleValue: user.balance ? parseFloat(user.balance) : 0 },
                 go_points: { integerValue: user.go_points ? parseInt(user.go_points) : 0 },
                 previous_mongo_id: { stringValue: docId },
                 migrated_at: { timestampValue: new Date().toISOString() }
             };

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
            
            const fields = {
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

async function commitBatch(writes) {
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
        const text = await response.text();
        console.error(`\nBatch Write Failed: ${response.status} - ${text.substring(0, 100)}...`);
    }
}

migrateUsers().catch(console.error);
