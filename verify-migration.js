
const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verify() {
  console.log('🔍 Verifying MongoDB Migration (CommonJS mode)...');
  
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing');
    process.exit(1);
  }

  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db(process.env.MONGODB_DB || 'gogocash');
    const collection = db.collection('shopee_products');

    const count = await collection.countDocuments();
    console.log(`📦 Total Documents: ${count}`);

    if (count === 0) {
      console.warn('⚠️  Collection is empty!');
    } else {
        const sample = await collection.findOne();
        console.log('📄 Sample Document:', JSON.stringify(sample, null, 2));
    }

    // Test Search
    console.log('\n🔎 Testing Search...');
    const searchRes = await collection.find({ $text: { $search: 'phone' } }).limit(1).toArray();
    console.log(`   Search 'phone' result count: ${searchRes.length}`);

  } catch (err) {
    console.error('❌ Verification Failed:', err);
  } finally {
    await client.close();
  }
}

verify();
