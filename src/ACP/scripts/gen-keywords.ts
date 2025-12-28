
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const uri = process.env.MONGODB_URI;

async function main() {
    if (!uri) {
        console.error('MONGODB_URI not found');
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        console.log('Connected to MongoDB');

        const db = client.db('gogocash');
        const collection = db.collection('shopee_products');

        const products = await collection.find({}).limit(20).toArray();

        console.log('--- Product Samples ---');
        products.forEach((p, i) => {
            console.log(`\n[${i+1}] ${p.name}`);
            if (p.description) {
                console.log(`Desc: ${p.description.substring(0, 100)}...`);
            }
            if (p.category) { // Assuming category exists
                console.log(`Cat: ${p.category}`);
            }
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await client.close();
    }
}

main();
