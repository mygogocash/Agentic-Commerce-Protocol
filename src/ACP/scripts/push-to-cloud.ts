/**
 * Data Migration Script - MongoDB Version
 * 
 * Migrates Shopee product data from CSV to MongoDB Atlas.
 * Uses bulk upsert for efficient data loading.
 * 
 * Usage: npx ts-node src/ACP/scripts/push-to-cloud.ts
 */

import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { MongoClient, Collection } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INPUT_FILE = path.join(process.cwd(), 'data-feed', 'shopee_datafeed.csv');
const BATCH_SIZE = 1000;

interface ShopeeProduct {
    itemid: string;
    title: string;
    price: number;
    price_usd: number;
    currency: string;
    rating: number;
    sold: number;
    image_url: string;
    product_url: string;
    affiliate_link: string;
    updated_at: Date;
}

async function migrate() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB || 'gogocash';

    if (!uri) {
        console.error('❌ Error: MONGODB_URI is not defined in .env.local');
        console.log('\nPlease add your MongoDB Atlas connection string:');
        console.log('MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority');
        process.exit(1);
    }

    // Check if input file exists
    if (!fs.existsSync(INPUT_FILE)) {
        console.error(`❌ Error: Input file not found: ${INPUT_FILE}`);
        console.log('\nPlease ensure your Shopee CSV data feed is at:');
        console.log('  data-feed/shopee_datafeed.csv');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    console.log('🔄 Connecting to MongoDB Atlas...');
    await client.connect();
    console.log('✅ Connected!\n');

    const db = client.db(dbName);
    const collection = db.collection('shopee_products');

    try {
        // Note: Indexes should already exist from mongodb-setup.ts
        // If running for the first time, run: npx ts-node src/ACP/data/mongodb-setup.ts
        console.log('📂 Starting data migration...');
        console.log(`   Source: ${INPUT_FILE}\n`);

        const parser = fs
            .createReadStream(INPUT_FILE)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            }));

        let batch: ShopeeProduct[] = [];
        let total = 0;
        let skipped = 0;

        for await (const row of parser) {
            // Quality filter: skip out-of-stock or zero-price items
            const stock = parseInt(row.stock || '0', 10);
            if (stock <= 0) {
                skipped++;
                continue;
            }

            const price = parseFloat(row.sale_price || row.price || '0');
            if (price <= 0) {
                skipped++;
                continue;
            }

            // Calculate USD price (approx 1 USD = 34 THB)
            const price_usd = Number((price / 34).toFixed(2));

            const product: ShopeeProduct = {
                itemid: String(row.itemid),
                title: (row.title || '').replace(/\0/g, ''),
                price: price,
                price_usd: price_usd,
                currency: 'THB',
                rating: parseFloat(row.item_rating || '0'),
                sold: parseInt(row.item_sold || '0', 10),
                image_url: (row.image_link || row.image_link_1 || '').replace(/\0/g, ''),
                product_url: (row.product_link || '').replace(/\0/g, ''),
                affiliate_link: (row['product_short link'] || row.product_link || '').replace(/\0/g, ''),
                updated_at: new Date()
            };

            batch.push(product);

            if (batch.length >= BATCH_SIZE) {
                await insertBatch(collection, batch);
                total += batch.length;
                process.stdout.write(`\r   📦 Migrated ${total.toLocaleString()} products...`);
                batch = [];
            }
        }

        // Insert remaining items
        if (batch.length > 0) {
            await insertBatch(collection, batch);
            total += batch.length;
        }

        console.log(`\r   📦 Migrated ${total.toLocaleString()} products... ✅`);
        console.log(`   ⏭️  Skipped ${skipped.toLocaleString()} (out of stock or zero price)`);

        // Final stats
        console.log('\n📊 Final Statistics:');
        console.log('─'.repeat(40));
        
        const count = await collection.countDocuments();
        console.log(`   Total documents in collection: ${count.toLocaleString()}`);

        try {
            const stats = await db.command({ collStats: 'shopee_products' });
            console.log(`   Collection size: ${((stats.size || 0) / 1024 / 1024).toFixed(2)} MB`);
            console.log(`   Index count: ${stats.nindexes || 0}`);
        } catch {
            // Stats might not be available on free tier
        }

        console.log('\n✅ Migration complete!');

    } catch (err) {
        console.error('\n❌ Migration failed:', err);
        process.exit(1);
    } finally {
        await client.close();
        console.log('🔌 Connection closed');
    }
}

/**
 * Insert a batch of products using bulk upsert
 */
async function insertBatch(collection: Collection, batch: ShopeeProduct[]): Promise<void> {
    const operations = batch.map(product => ({
        updateOne: {
            filter: { itemid: product.itemid },
            update: { $set: product },
            upsert: true
        }
    }));

    await collection.bulkWrite(operations, { ordered: false });
}

migrate();
