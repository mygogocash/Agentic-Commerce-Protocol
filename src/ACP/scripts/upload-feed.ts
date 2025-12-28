
import { MongoClient } from 'mongodb';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { initializeApp, cert } from 'firebase-admin/app';
import { getStorage } from 'firebase-admin/storage';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
// Note: Generating a Service Account Key is required for this script to run locally
const SERVICE_ACCOUNT_PATH = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './service-account.json';

async function main() {
    // 1. Fetch Data from MongoDB
    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI is missing in .env.local');
        process.exit(1);
    }

    const client = new MongoClient(MONGODB_URI);
    let products = [];

    try {
        console.log('🔌 Connecting to MongoDB...');
        await client.connect();
        const db = client.db('gogocash');
        const collection = db.collection('shopee_products');

        console.log('📥 Fetching all products...');
        products = await collection.find({}).toArray();
        console.log(`✅ Fetched ${products.length} products.`);

    } catch (err) {
        console.error('❌ MongoDB Error:', err);
        process.exit(1);
    } finally {
        await client.close();
    }

    // 2. Prepare JSON File
    const dumpPath = path.resolve(process.cwd(), 'product_feed.json');
    fs.writeFileSync(dumpPath, JSON.stringify(products, null, 2));
    console.log(`💾 Saved local dump to ${dumpPath}`);

    // 3. Upload to Firebase Storage
    console.log('🔥 Initializing Firebase Storage upload...');
    
    if (!fs.existsSync(SERVICE_ACCOUNT_PATH)) {
        console.error(`
⚠️  MISSING SERVICE ACCOUNT KEY
To upload to Firebase Storage verify-robustness, I need admin permissions.
1. Go to Firebase Console > Project Settings > Service Accounts.
2. Click "Generate new private key".
3. Save the file as 'service-account.json' in this folder.
4. Run this script again.
        `);
        return;
    }

    try {
        const serviceAccount = require(path.resolve(process.cwd(), SERVICE_ACCOUNT_PATH));
        
        initializeApp({
            credential: cert(serviceAccount),
            storageBucket: 'gogocash-acp.firebasestorage.app' 
        });

        const bucket = getStorage().bucket();
        const destination = 'feeds/product_feed.json';

        console.log(`🚀 Uploading to gs://gogocash-acp.firebasestorage.app/${destination}...`);
        
        await bucket.upload(dumpPath, {
            destination: destination,
            metadata: {
                contentType: 'application/json',
            }
        });

        console.log('✅ Upload Complete!');

    } catch (err) {
        console.error('❌ Firebase Upload Error:', err);
    }
}

main();
