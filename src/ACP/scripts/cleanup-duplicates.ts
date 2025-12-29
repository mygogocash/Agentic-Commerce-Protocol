
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'gogocash';

if (!MONGODB_URI) {
    console.error('Missing MONGODB_URI');
    process.exit(1);
}

const cleanupDuplicates = async () => {
    const client = new MongoClient(MONGODB_URI);

    try {
        await client.connect();
        console.log('Connected to MongoDB.');
        const db = client.db(MONGODB_DB);
        const users = db.collection('users');

        // 1. Find duplicates by Email
        console.log('Finding duplicate emails...');
        const duplicates = await users.aggregate([
            { $group: {
                _id: { email: "$email" }, // Case sensitive? Standardize if needed
                uniqueIds: { $addToSet: "$_id" },
                count: { $sum: 1 }
            }},
            { $match: { 
                count: { $gt: 1 },
                "_id.email": { $ne: null } // Ignore nulls if any
            }}
        ]).toArray();

        console.log(`Found ${duplicates.length} sets of duplicates.`);

        for (const doc of duplicates) {
            const ids = doc.uniqueIds;
            const email = doc._id.email;
            
            // Sort to keep the most recent one (highest ObjectId roughly implies updated/created later if standard logic, 
            // but effectively valid to just keep one)
            // Or better, we can check 'joined_at' if available, but ObjectId is safe proxy for creation time.
            ids.sort().reverse(); // Keep the "largest" ObjectId (Newest)
            
            const [toKeep, ...toDelete] = ids; // Keep the first (newest), delete others
            
            if (toDelete.length > 0) {
                console.log(`Cleaning duplicates for ${email}: Keeping ${toKeep}, Deleting ${toDelete.length} records.`);
                await users.deleteMany({ _id: { $in: toDelete } });
            }
        }

        console.log('Duplicate cleanup complete.');

    } catch (error) {
        console.error('Error cleaning duplicates:', error);
    } finally {
        await client.close();
    }
};

cleanupDuplicates();
