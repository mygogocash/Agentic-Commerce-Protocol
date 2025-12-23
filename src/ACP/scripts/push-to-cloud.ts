import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse';
import { Client } from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const INPUT_FILE = path.join(process.cwd(), 'data-feed', 'shopee_datafeed.csv');
const BATCH_SIZE = 1000;

async function migrate() {
    if (!process.env.DATABASE_URL) {
        console.error('Error: DATABASE_URL is not defined in .env.local');
        console.log('Please add your connection string: DATABASE_URL=postgresql://user:pass@host:5432/db');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false } // Required for Supabase/most cloud DBs
    });

    console.log('Connecting to database...');
    await client.connect();

    try {
        console.log('Creating table if not exists...');
        const schema = fs.readFileSync(path.join(process.cwd(), 'src/ACP/data/schema.sql'), 'utf-8');
        await client.query(schema);

        console.log('Starting migration...');
        const parser = fs
            .createReadStream(INPUT_FILE)
            .pipe(parse({
                columns: true,
                skip_empty_lines: true,
                relax_quotes: true,
                relax_column_count: true
            }));

        // Batch is an array of arrays (rows)
        let batch: (string | number | bigint | null)[][] = [];
        let total = 0;

        for await (const row of parser) {
            // Filter quality (similar to previous script)
            const stock = parseInt(row.stock || '0', 10);
            if (stock <= 0) continue;
            const price = parseFloat(row.sale_price || row.price || '0');
            if (price <= 0) continue;

            const price_usd = Number((price / 34).toFixed(2));

            const itemid = BigInt(row.itemid);
            const title = (row.title || '').replace(/\0/g, '');
            const sold = parseInt(row.item_sold || '0', 10);
            const rating = parseFloat(row.item_rating || '0');
            const image_url = (row.image_link || row.image_link_1 || '').replace(/\0/g, '');
            const product_url = (row.product_link || '').replace(/\0/g, '');
            const affiliate_link = (row['product_short link'] || row.product_link || '').replace(/\0/g, '');

            batch.push([itemid, title, price, price_usd, 'THB', rating, sold, image_url, product_url, affiliate_link]);

            if (batch.length >= BATCH_SIZE) {
                await insertBatch(client, batch);
                total += batch.length;
                process.stdout.write(`\rInserted ${total} products...`);
                batch = [];
            }
        }

        if (batch.length > 0) {
            await insertBatch(client, batch);
            total += batch.length;
        }

        console.log(`\nMigration complete! Total products: ${total}`);

    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await client.end();
    }
}

async function insertBatch(client: Client, batch: (string | number | bigint | null)[][]) {
    // Construct query
    // We use ON CONFLICT DO UPDATE to handle re-runs
    const values = batch.map((_, i) => 
        `($${i * 10 + 1}, $${i * 10 + 2}, $${i * 10 + 3}, $${i * 10 + 4}, $${i * 10 + 5}, $${i * 10 + 6}, $${i * 10 + 7}, $${i * 10 + 8}, $${i * 10 + 9}, $${i * 10 + 10})`
    ).join(',');

    const query = `
        INSERT INTO shopee_products (itemid, title, price, price_usd, currency, rating, sold, image_url, product_url, affiliate_link)
        VALUES ${values}
        ON CONFLICT (itemid) DO UPDATE SET
            title = EXCLUDED.title,
            price = EXCLUDED.price,
            price_usd = EXCLUDED.price_usd,
            sold = EXCLUDED.sold,
            updated_at = NOW();
    `;

    const flatValues = batch.flat().map(v => typeof v === 'bigint' ? v.toString() : v);
    await client.query(query, flatValues);
}

migrate();
