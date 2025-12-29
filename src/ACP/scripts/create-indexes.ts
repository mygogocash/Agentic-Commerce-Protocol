
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'gogocash';

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI in .env.local');
    process.exit(1);
}

const createIndexes = async () => {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB.');
        
        const db = client.db(MONGODB_DB);

        // 1. Users Collection
        console.log('Indexing "users" collection...');
        const users = db.collection('users');
        await users.createIndex({ email: 1 }, { unique: true, sparse: true });
        await users.createIndex({ phone: 1 }, { unique: true, sparse: true });
        await users.createIndex({ wallet_address: 1 }, { unique: true, sparse: true });
        // Single field index on _id is automatic, but if we query by others often:
        // await users.createIndex({ created_at: -1 }); 

        // 2. Sessions Collection
        // (If you are using a DB session store)
        // console.log('Indexing "sessions" collection...');
        // const sessions = db.collection('sessions');
        // await sessions.createIndex({ token: 1 }, { unique: true });
        // TTL Index (Auto-delete documents after expiry?) 
        // Note: Logic currently handles expiry in code, but TTL is good hygiene.
        // await sessions.createIndex({ expires_at: 1 }, { expireAfterSeconds: 0 });

        // 3. User Cashbacks
        console.log('Indexing "usermycashback" collection...');
        const cashbacks = db.collection('usermycashback');
        await cashbacks.createIndex({ userId: 1 }); // For finding by user
        await cashbacks.createIndex({ created_at: -1 }); // For sorting recent

        console.log('All indexes created successfully!');

    } catch (error) {
        console.error('Error creating indexes:', error);
    } finally {
        await client.close();
    }
};

createIndexes();
