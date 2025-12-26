/**
 * MongoDB Connection Utility
 * 
 * Singleton pattern for connection reuse in serverless environments (Vercel/Next.js).
 * Uses connection caching to avoid repeated connections per request.
 */

import { MongoClient, Db, Document } from 'mongodb';

// Extend global to cache the MongoDB client
declare global {
    // eslint-disable-next-line no-var
    var _mongoClient: MongoClient | undefined;
    var _mongoDb: Db | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'gogocash';

if (!MONGODB_URI) {
    console.warn('[MongoDB] Warning: MONGODB_URI not defined. Database features disabled.');
}

/**
 * Configuration for MongoDB client
 * Tuned for serverless environments
 */
const clientOptions = {
    maxPoolSize: 5,          // Limit connections for serverless
    minPoolSize: 1,          // Keep at least 1 connection ready
    maxIdleTimeMS: 30000,    // Close idle connections after 30s
    connectTimeoutMS: 10000, // Connection timeout
    socketTimeoutMS: 45000,  // Socket timeout
};

/**
 * Get the MongoDB client (cached for connection reuse)
 */
export async function getMongoClient(): Promise<MongoClient | null> {
    if (!MONGODB_URI) {
        return null;
    }

    // Use cached client if available (important for serverless)
    if (global._mongoClient) {
        return global._mongoClient;
    }

    try {
        const client = new MongoClient(MONGODB_URI, clientOptions);
        await client.connect();
        
        // Cache the client globally
        global._mongoClient = client;
        console.log('[MongoDB] Connected successfully');
        
        return client;
    } catch (error) {
        console.error('[MongoDB] Connection error:', error);
        return null;
    }
}

/**
 * Get the MongoDB database instance
 */
export async function getDatabase(): Promise<Db | null> {
    // Use cached db if available
    if (global._mongoDb) {
        return global._mongoDb;
    }

    const client = await getMongoClient();
    if (!client) {
        return null;
    }

    const db = client.db(MONGODB_DB);
    global._mongoDb = db;
    
    return db;
}

/**
 * Get a specific collection from the database
 */
export async function getCollection<T extends Document>(collectionName: string) {
    const db = await getDatabase();
    if (!db) {
        return null;
    }
    
    return db.collection<T>(collectionName);
}

/**
 * Close the MongoDB connection
 * (Useful for scripts, not typically needed in serverless)
 */
export async function closeConnection(): Promise<void> {
    if (global._mongoClient) {
        await global._mongoClient.close();
        global._mongoClient = undefined;
        global._mongoDb = undefined;
        console.log('[MongoDB] Connection closed');
    }
}

// Collection names as constants
export const Collections = {
    SHOPEE_PRODUCTS: 'shopee_products',
} as const;
