/**
 * Database Statistics Script - MongoDB Version
 * 
 * Displays stats about your MongoDB collection:
 * - Document count
 * - Collection size
 * - Index information
 * - Sample document
 * 
 * Usage: npx ts-node src/ACP/scripts/check-db-stats.ts
 */

import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function checkStats() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'gogocash';

    if (!uri) {
        console.error('❌ MONGODB_URI not configured');
        console.log('\nPlease add to .env.local:');
        console.log('MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        console.log('🔄 Connecting to MongoDB...');
        await client.connect();
        console.log('✅ Connected!\n');

        const db = client.db(dbName);
        const collection = db.collection('shopee_products');

        // Document count
        const count = await collection.countDocuments();
        console.log('📊 Collection Statistics');
        console.log('═'.repeat(50));
        console.log(`   📦 Total documents: ${count.toLocaleString()}`);

        // Collection stats (may not be available on all tiers)
        try {
            const stats = await db.command({ collStats: 'shopee_products' });
            console.log(`   💾 Collection size: ${((stats.size || 0) / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   📇 Index count: ${stats.nindexes || 0}`);
            console.log(`   📚 Index size: ${((stats.totalIndexSize || 0) / 1024 / 1024).toFixed(2)} MB`);
        } catch (e) {
            console.log('   ℹ️  Detailed stats not available (requires specific permissions)');
        }

        // Index information
        console.log('\n📇 Indexes');
        console.log('─'.repeat(50));
        const indexes = await collection.indexes();
        indexes.forEach((idx, i) => {
            const keyStr = Object.entries(idx.key)
                .map(([k, v]) => `${k}: ${v}`)
                .join(', ');
            console.log(`   ${i + 1}. ${idx.name}`);
            console.log(`      Keys: { ${keyStr} }`);
            if (idx.unique) console.log('      Unique: true');
            if (idx.weights) console.log(`      Weights: ${JSON.stringify(idx.weights)}`);
        });

        // Sample document
        console.log('\n📄 Sample Document');
        console.log('─'.repeat(50));
        const sample = await collection.findOne();
        if (sample) {
            // Pretty print with truncation for long fields
            const displayDoc = { ...sample };
            if (displayDoc.title && displayDoc.title.length > 60) {
                displayDoc.title = displayDoc.title.substring(0, 60) + '...';
            }
            if (displayDoc.image_url && displayDoc.image_url.length > 50) {
                displayDoc.image_url = displayDoc.image_url.substring(0, 50) + '...';
            }
            if (displayDoc.affiliate_link && displayDoc.affiliate_link.length > 50) {
                displayDoc.affiliate_link = displayDoc.affiliate_link.substring(0, 50) + '...';
            }
            console.log(JSON.stringify(displayDoc, null, 2));
        } else {
            console.log('   No documents found');
        }

        // Quick search test
        console.log('\n🔍 Quick Search Test');
        console.log('─'.repeat(50));
        try {
            const searchResult = await collection
                .find({ $text: { $search: 'phone' } })
                .limit(3)
                .toArray();
            console.log(`   Search for "phone": ${searchResult.length} results`);
            searchResult.forEach((doc, i) => {
                const title = doc.title?.substring(0, 50) + (doc.title?.length > 50 ? '...' : '');
                console.log(`   ${i + 1}. ${title}`);
            });
        } catch (e) {
            console.log('   ⚠️  Text search not available (run mongodb-setup.ts first)');
        }

        console.log('\n✅ Done!');

    } finally {
        await client.close();
        console.log('🔌 Connection closed');
    }
}

checkStats();
