import { Client } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

async function checkStats() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL missing');
        process.exit(1);
    }

    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to DB.');

        // 1. Count Total Rows
        const countRes = await client.query('SELECT count(*) FROM shopee_products;');
        const count = parseInt(countRes.rows[0].count, 10);
        console.log(`\nTotal Shopee Products in Cloud DB: ${count.toLocaleString()}`);

        if (count === 0) {
            console.warn('⚠️  Warning: Database is empty. Migration script might have failed or hasn\'t run.');
        } else {
            // 2. Sample Data
            const sampleRes = await client.query('SELECT itemid, title, price, price_usd, currency FROM shopee_products LIMIT 3;');
            console.log('\nSample Rows:');
            console.table(sampleRes.rows);
        }

        // 3. Check Index
        // Simply query pg_indexes
        const indexRes = await client.query(`
            SELECT indexname, indexdef 
            FROM pg_indexes 
            WHERE tablename = 'shopee_products';
        `);
        console.log('\nIndexes Found:');
        indexRes.rows.forEach(row => console.log(`- ${row.indexname}`));

    } catch (err) {
        console.error('Stats check failed:', err);
    } finally {
        await client.end();
    }
}

checkStats();
