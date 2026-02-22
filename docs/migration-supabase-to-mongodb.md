# Migration Guide: Supabase (PostgreSQL) → MongoDB

This guide outlines the steps to migrate your GoGoCash application from Supabase PostgreSQL to MongoDB.

---

## 📋 Current Architecture Overview

Your application currently uses:

- **Database**: Supabase (PostgreSQL)
- **Client Library**: `pg` (node-postgres)
- **Features Used**:
  - Full-text search (`tsvector`, `websearch_to_tsquery`)
  - Connection pooling (`Pool`)
  - SSL connections
  - Batch inserts with upsert (`ON CONFLICT DO UPDATE`)

### Files That Need Changes

| File                                | Purpose                | Changes Required                |
| ----------------------------------- | ---------------------- | ------------------------------- |
| `src/ACP/shopee.ts`                 | Product search service | Full rewrite to MongoDB driver  |
| `src/ACP/scripts/push-to-cloud.ts`  | Data migration script  | Full rewrite for MongoDB        |
| `src/ACP/scripts/check-db-stats.ts` | Database stats checker | Update for MongoDB              |
| `src/ACP/data/schema.sql`           | SQL schema             | Convert to MongoDB setup script |
| `package.json`                      | Dependencies           | Replace `pg` with `mongodb`     |
| `.env.local`                        | Environment variables  | Update connection string        |

---

## 📦 Step 1: Choose a MongoDB Provider

### Recommended: MongoDB Atlas (Free Tier Available)

| Feature          | Free Tier (M0)  | Paid (M2+)      |
| ---------------- | --------------- | --------------- |
| Storage          | 512 MB          | 2GB+            |
| RAM              | Shared          | 2GB+            |
| Connections      | 500             | Unlimited       |
| Full-text Search | ✅ Atlas Search | ✅ Atlas Search |

**Steps to set up Atlas:**

1. Go to [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a free cluster (M0)
3. Set up database user (username/password)
4. Add your IP to whitelist (or use `0.0.0.0/0` for development)
5. Get connection string: `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/<dbname>`

### Alternative Options

- **Railway.app** - Simple MongoDB hosting
- **DigitalOcean Managed MongoDB** - Cost-effective
- **Self-hosted** - Full control but more maintenance

---

## 📦 Step 2: Update Dependencies

```bash
# Remove PostgreSQL dependency
npm uninstall pg @types/pg

# Install MongoDB driver
npm install mongodb
```

Update your `package.json`:

```json
{
  "dependencies": {
    "mongodb": "^6.12.0",
    "csv-parse": "^6.1.0",
    "dotenv": "^17.2.3",
    "next": "16.0.10",
    "react": "19.2.1",
    "react-dom": "19.2.1"
  }
}
```

---

## 🔧 Step 3: Update Environment Variables

Replace your `.env.local`:

```env
# OLD - Supabase PostgreSQL
# DATABASE_URL=postgresql://user:pass@db.xxx.supabase.co:5432/postgres

# NEW - MongoDB Atlas
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/gogocash?retryWrites=true&w=majority
MONGODB_DB=gogocash
```

---

## 📄 Step 4: Create MongoDB Schema/Indexes

Create a new file `src/ACP/data/mongodb-setup.ts`:

```typescript
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function setupMongoDB() {
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in .env.local");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    await client.connect();
    console.log("Connected to MongoDB");

    const db = client.db(process.env.MONGODB_DB || "gogocash");
    const collection = db.collection("shopee_products");

    // Create indexes for fast search
    console.log("Creating indexes...");

    // 1. Unique index on itemid
    await collection.createIndex({ itemid: 1 }, { unique: true });

    // 2. Text index for full-text search (similar to PostgreSQL FTS)
    await collection.createIndex(
      { title: "text" },
      {
        weights: { title: 10 },
        name: "title_text_index",
        default_language: "english",
      }
    );

    // 3. Index for price filtering
    await collection.createIndex({ price_usd: 1 });

    // 4. Index for sorting by popularity
    await collection.createIndex({ sold: -1 });

    console.log("MongoDB setup complete!");

    // Print collection stats
    const stats = await db.command({ collStats: "shopee_products" });
    console.log("Collection stats:", {
      count: stats.count,
      size: `${(stats.size / 1024 / 1024).toFixed(2)} MB`,
      indexes: stats.nindexes,
    });
  } finally {
    await client.close();
  }
}

setupMongoDB();
```

> **Note**: For advanced full-text search similar to PostgreSQL's `websearch_to_tsquery`, consider using **MongoDB Atlas Search** which provides more powerful search capabilities.

---

## 📄 Step 5: Rewrite the Shopee Service

Replace `src/ACP/shopee.ts`:

```typescript
import { MongoClient, Db, Collection } from "mongodb";

let client: MongoClient | null = null;
let db: Db | null = null;

// Connection helper with singleton pattern
async function getCollection(): Promise<Collection | null> {
  if (!process.env.MONGODB_URI) {
    console.error("[MongoDB] MONGODB_URI not configured");
    return null;
  }

  if (!client) {
    client = new MongoClient(process.env.MONGODB_URI, {
      maxPoolSize: 5,
      minPoolSize: 1,
    });
    await client.connect();
    db = client.db(process.env.MONGODB_DB || "gogocash");
  }

  return db!.collection("shopee_products");
}

export interface Product {
  product_id: string;
  product_name: string;
  product_price: number;
  product_price_usd?: number;
  currency: string;
  merchant_name: string;
  merchant_logo: string;
  image_url: string;
  product_url: string;
  rating: number;
  reviews_count: number;
  cashback_rate: number;
  estimated_cashback: number;
  affiliate_link: string;
  in_stock: boolean;
}

export const shopeeService = {
  search: async (query: string): Promise<Product[]> => {
    if (!query) return [];

    const collection = await getCollection();
    if (!collection) {
      console.error(
        "[ShopeeService] MongoDB not configured. Search unavailable."
      );
      return [];
    }

    try {
      // 1. Parse query for price filters
      let cleanQuery = query;
      let maxPrice: number | null = null;
      let minPrice: number | null = null;

      const underMatch = query.match(/(?:under|below|<)\s?\$?(\d+)/i);
      if (underMatch) {
        maxPrice = parseInt(underMatch[1]);
        cleanQuery = cleanQuery.replace(underMatch[0], "").trim();
      }

      const overMatch = query.match(/(?:over|above|>)\s?\$?(\d+)/i);
      if (overMatch) {
        minPrice = parseInt(overMatch[1]);
        cleanQuery = cleanQuery.replace(overMatch[0], "").trim();
      }

      // Remove conversational filler
      cleanQuery = cleanQuery
        .replace(
          /\b(gift|ideas|idea|suggestion|recommendations?|recommend|best|top)\b/gi,
          ""
        )
        .replace(/\bgadgets?\b/gi, "electronics")
        .trim();

      console.log(`Original: "${query}" -> Clean: "${cleanQuery}"`);

      if (!cleanQuery) cleanQuery = "product";

      // 2. Build MongoDB query
      const filter: any = {
        $text: { $search: cleanQuery },
      };

      // Add price filters
      if (maxPrice !== null || minPrice !== null) {
        filter.price_usd = {};
        if (maxPrice !== null) filter.price_usd.$lte = maxPrice;
        if (minPrice !== null) filter.price_usd.$gte = minPrice;
      }

      // 3. Execute search with text score sorting
      let results = await collection
        .find(filter, {
          projection: { score: { $meta: "textScore" } },
        })
        .sort({ score: { $meta: "textScore" } })
        .limit(20)
        .toArray();

      // 4. Fallback to regex search if no results
      if (results.length === 0 && !maxPrice && !minPrice) {
        console.log(
          `[Shopee] Text search found 0. Trying regex fallback for: ${cleanQuery}`
        );
        results = await collection
          .find({
            title: { $regex: cleanQuery, $options: "i" },
          })
          .limit(20)
          .toArray();
      }

      // 5. Map results to Product interface
      return results.map((row) => ({
        product_id: `shp_mongo_${row.itemid}`,
        product_name: row.title,
        product_price: parseFloat(row.price),
        product_price_usd: row.price_usd
          ? parseFloat(row.price_usd)
          : undefined,
        currency: row.currency,
        merchant_name: "Shopee",
        merchant_logo:
          "https://cf.shopee.co.th/file/38d3010b996b7d22f281e69974261899",
        image_url: row.image_url,
        product_url: row.product_url,
        rating: parseFloat(row.rating),
        reviews_count: row.sold,
        cashback_rate: 0.05,
        estimated_cashback: Number((parseFloat(row.price) * 0.05).toFixed(2)),
        affiliate_link: `https://gogocash-acp.vercel.app/api/redirect?url=${encodeURIComponent(
          row.affiliate_link || row.product_url
        )}`,
        in_stock: true,
      }));
    } catch (err) {
      console.error("[ShopeeService] MongoDB search error:", err);
      return [];
    }
  },
};
```

---

## 📄 Step 6: Rewrite the Data Migration Script

Replace `src/ACP/scripts/push-to-cloud.ts`:

```typescript
import fs from "fs";
import path from "path";
import { parse } from "csv-parse";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const INPUT_FILE = path.join(process.cwd(), "data-feed", "shopee_datafeed.csv");
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
  if (!process.env.MONGODB_URI) {
    console.error("Error: MONGODB_URI is not defined in .env.local");
    console.log(
      "Please add: MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname"
    );
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  console.log("Connecting to MongoDB...");
  await client.connect();

  const db = client.db(process.env.MONGODB_DB || "gogocash");
  const collection = db.collection("shopee_products");

  try {
    // Create indexes first
    console.log("Creating indexes...");
    await collection.createIndex({ itemid: 1 }, { unique: true });
    await collection.createIndex(
      { title: "text" },
      { default_language: "english" }
    );
    await collection.createIndex({ price_usd: 1 });
    await collection.createIndex({ sold: -1 });

    console.log("Starting migration...");
    const parser = fs.createReadStream(INPUT_FILE).pipe(
      parse({
        columns: true,
        skip_empty_lines: true,
        relax_quotes: true,
        relax_column_count: true,
      })
    );

    let batch: ShopeeProduct[] = [];
    let total = 0;

    for await (const row of parser) {
      // Filter quality
      const stock = parseInt(row.stock || "0", 10);
      if (stock <= 0) continue;
      const price = parseFloat(row.sale_price || row.price || "0");
      if (price <= 0) continue;

      const price_usd = Number((price / 34).toFixed(2));

      const product: ShopeeProduct = {
        itemid: row.itemid,
        title: (row.title || "").replace(/\0/g, ""),
        price: price,
        price_usd: price_usd,
        currency: "THB",
        rating: parseFloat(row.item_rating || "0"),
        sold: parseInt(row.item_sold || "0", 10),
        image_url: (row.image_link || row.image_link_1 || "").replace(
          /\0/g,
          ""
        ),
        product_url: (row.product_link || "").replace(/\0/g, ""),
        affiliate_link: (
          row["product_short link"] ||
          row.product_link ||
          ""
        ).replace(/\0/g, ""),
        updated_at: new Date(),
      };

      batch.push(product);

      if (batch.length >= BATCH_SIZE) {
        await insertBatch(collection, batch);
        total += batch.length;
        process.stdout.write(`\rInserted ${total} products...`);
        batch = [];
      }
    }

    if (batch.length > 0) {
      await insertBatch(collection, batch);
      total += batch.length;
    }

    console.log(`\nMigration complete! Total products: ${total}`);

    // Print stats
    const count = await collection.countDocuments();
    console.log(`Final document count: ${count}`);
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await client.close();
  }
}

async function insertBatch(collection: any, batch: ShopeeProduct[]) {
  // Use bulkWrite for upsert behavior
  const operations = batch.map((product) => ({
    updateOne: {
      filter: { itemid: product.itemid },
      update: { $set: product },
      upsert: true,
    },
  }));

  await collection.bulkWrite(operations, { ordered: false });
}

migrate();
```

---

## 📊 Step 7: Update Database Stats Script

Replace `src/ACP/scripts/check-db-stats.ts`:

```typescript
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function checkStats() {
  if (!process.env.MONGODB_URI) {
    console.error("MONGODB_URI not configured");
    process.exit(1);
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();

  const db = client.db(process.env.MONGODB_DB || "gogocash");
  const collection = db.collection("shopee_products");

  try {
    // Document count
    const count = await collection.countDocuments();
    console.log(`Total products: ${count}`);

    // Collection stats
    const stats = await db.command({ collStats: "shopee_products" });
    console.log(`Collection size: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`Index count: ${stats.nindexes}`);

    // Sample product
    const sample = await collection.findOne();
    console.log("\nSample product:", JSON.stringify(sample, null, 2));

    // Index info
    const indexes = await collection.indexes();
    console.log("\nIndexes:");
    indexes.forEach((idx) => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
  } finally {
    await client.close();
  }
}

checkStats();
```

---

## 🔍 Feature Comparison: PostgreSQL vs MongoDB

| Feature            | PostgreSQL (Supabase)               | MongoDB Atlas                   |
| ------------------ | ----------------------------------- | ------------------------------- |
| Full-text search   | `tsvector` + `websearch_to_tsquery` | Text index + `$text` operator   |
| Upsert             | `ON CONFLICT DO UPDATE`             | `updateOne` with `upsert: true` |
| Connection pooling | `Pool` from `pg`                    | Built-in via `MongoClient`      |
| Schema validation  | SQL constraints                     | JSON Schema (optional)          |
| Advanced search    | PostgreSQL FTS                      | Atlas Search (Lucene-based)     |

---

## 🚀 Step 8: Deploy and Test

### 1. Run the setup script:

```bash
npx ts-node src/ACP/data/mongodb-setup.ts
```

### 2. Migrate your data:

```bash
npx ts-node src/ACP/scripts/push-to-cloud.ts
```

### 3. Verify the migration:

```bash
npx ts-node src/ACP/scripts/check-db-stats.ts
```

### 4. Test search:

```bash
# Create a quick test script or test via your API
curl "http://localhost:3000/api/products?q=phone%20under%20500"
```

### 5. Deploy to Vercel:

```bash
# Add environment variable to Vercel
vercel env add MONGODB_URI
vercel env add MONGODB_DB

vercel --prod
```

---

## ⚠️ Important Considerations

### 1. Connection Handling in Serverless

MongoDB connections in serverless (Vercel) need special handling:

```typescript
// Recommended pattern for Next.js/Vercel
let cachedClient: MongoClient | null = null;

async function getClient(): Promise<MongoClient> {
  if (cachedClient) {
    return cachedClient;
  }

  cachedClient = new MongoClient(process.env.MONGODB_URI!, {
    maxPoolSize: 1, // Keep low for serverless
    maxIdleTimeMS: 10000,
  });

  await cachedClient.connect();
  return cachedClient;
}
```

### 2. Atlas Search (Advanced)

For more powerful search similar to Elasticsearch, enable **MongoDB Atlas Search**:

```json
{
  "mappings": {
    "dynamic": false,
    "fields": {
      "title": {
        "type": "string",
        "analyzer": "lucene.standard"
      }
    }
  }
}
```

Then use `$search` aggregation:

```typescript
const results = await collection
  .aggregate([
    {
      $search: {
        index: "default",
        text: {
          query: searchQuery,
          path: "title",
          fuzzy: { maxEdits: 1 },
        },
      },
    },
    { $limit: 20 },
  ])
  .toArray();
```

### 3. Backup Your Supabase Data First!

Before migrating, export your current data:

```bash
pg_dump $DATABASE_URL > backup.sql
```

---

## 📝 Migration Checklist

- [ ] Create MongoDB Atlas account and cluster
- [ ] Get connection string
- [ ] Update `.env.local` with `MONGODB_URI`
- [ ] Run `npm uninstall pg @types/pg`
- [ ] Run `npm install mongodb`
- [ ] Update `src/ACP/shopee.ts`
- [ ] Update `src/ACP/scripts/push-to-cloud.ts`
- [ ] Update `src/ACP/scripts/check-db-stats.ts`
- [ ] Create `src/ACP/data/mongodb-setup.ts`
- [ ] Run MongoDB setup script
- [ ] Run data migration
- [ ] Verify data in MongoDB Atlas UI
- [ ] Test search functionality locally
- [ ] Add env vars to Vercel
- [ ] Deploy to production
- [ ] Verify production deployment

---

## 💡 Need Help?

- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [MongoDB Node.js Driver](https://www.mongodb.com/docs/drivers/node/current/)
- [MongoDB Atlas Search](https://www.mongodb.com/docs/atlas/atlas-search/)
