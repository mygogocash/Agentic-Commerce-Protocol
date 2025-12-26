/**
 * MongoDB Setup Script
 * 
 * Run this script to:
 * 1. Create the shopee_products collection
 * 2. Set up text indexes for search
 * 3. Create additional indexes for performance
 * 
 * Usage: npx ts-node src/ACP/data/mongodb-setup.ts
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function setupMongoDB() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'gogocash';

    if (!uri) {
        console.error('❌ Error: MONGODB_URI is not defined in .env.local');
        console.log('\nPlease add your MongoDB Atlas connection string:');
        console.log('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority');
        console.log('MONGODB_DB=gogocash');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('🔄 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected to MongoDB Atlas\n');

        const db = client.db(dbName);
        const collection = db.collection('shopee_products');

        // Check if collection exists
        const collections = await db.listCollections({ name: 'shopee_products' }).toArray();
        if (collections.length === 0) {
            console.log('📁 Creating shopee_products collection...');
            await db.createCollection('shopee_products');
        } else {
            console.log('📁 Collection shopee_products already exists');
        }

        // Create indexes
        console.log('\n🔧 Setting up indexes...\n');

        // 1. Unique index on itemid
        console.log('  1️⃣  Creating unique index on itemid...');
        await collection.createIndex(
            { itemid: 1 },
            { unique: true, name: 'itemid_unique' }
        );
        console.log('     ✅ itemid_unique index created');

        // 2. Text index for full-text search
        console.log('  2️⃣  Creating text index on title...');
        await collection.createIndex(
            { title: 'text' },
            {
                weights: { title: 10 },
                name: 'title_text_search',
                default_language: 'english'
            }
        );
        console.log('     ✅ title_text_search index created');

        // 3. Price index for filtering
        console.log('  3️⃣  Creating index on price_usd...');
        await collection.createIndex(
            { price_usd: 1 },
            { name: 'price_usd_asc' }
        );
        console.log('     ✅ price_usd_asc index created');

        // 4. Sold index for sorting by popularity
        console.log('  4️⃣  Creating index on sold (descending)...');
        await collection.createIndex(
            { sold: -1 },
            { name: 'sold_desc' }
        );
        console.log('     ✅ sold_desc index created');

        // 5. Compound index for common queries
        console.log('  5️⃣  Creating compound index for search + price...');
        await collection.createIndex(
            { price_usd: 1, sold: -1 },
            { name: 'price_sold_compound' }
        );
        console.log('     ✅ price_sold_compound index created');

        // Print stats
        console.log('\n📊 Collection Statistics:');
        console.log('─'.repeat(40));

        try {
            const stats = await db.command({ collStats: 'shopee_products' });
            console.log(`   Documents: ${stats.count || 0}`);
            console.log(`   Size: ${((stats.size || 0) / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Indexes: ${stats.nindexes || 0}`);
        } catch {
            console.log('   Documents: 0 (collection is empty)');
        }

        // List all indexes
        console.log('\n📋 Indexes Created:');
        console.log('─'.repeat(40));
        const indexes = await collection.indexes();
        indexes.forEach((idx, i) => {
            console.log(`   ${i + 1}. ${idx.name}: ${JSON.stringify(idx.key)}`);
        });

        console.log('\n✅ MongoDB setup complete!');
        console.log('\n📌 Next Steps:');
        console.log('   1. Run the data migration: npx ts-node src/ACP/scripts/push-to-cloud.ts');
        console.log('   2. Verify with: npx ts-node src/ACP/scripts/check-db-stats.ts');

        // Atlas Search notice
        console.log('\n💡 For Advanced Search (Atlas Search):');
        console.log('   If you want fuzzy matching and typo tolerance,');
        console.log('   create an Atlas Search index in the MongoDB Atlas UI.');
        console.log('   See: docs/migration-supabase-to-mongodb.md for details.');

    } catch (error) {
        console.error('❌ Setup failed:', error);
        process.exit(1);
    } finally {
        await client.close();
        console.log('\n🔌 Connection closed');
    }
}

setupMongoDB();
