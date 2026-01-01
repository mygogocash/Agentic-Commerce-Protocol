
import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

// Force dynamic to avoid static generation errors
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const phone = searchParams.get('phone');

  if (!email && !phone) {
    return NextResponse.json({ error: 'Please provide email or phone query parameter' }, { status: 400 });
  }

  // Use the Migration URI preferably, or standard URI
  const uri = process.env.MONGODB_MIGRATION_URI || process.env.MONGODB_URI;

  if (!uri) {
    return NextResponse.json({ error: 'MongoDB URI not configured in environment' }, { status: 500 });
  }

  let client;

  try {
    client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db('gogocash'); // Adjust DB name if needed
    const collection = db.collection('users');

    const query: any = {};
    if (email) query.email = email;
    if (phone) query.phone = phone;

    const user = await collection.findOne(query);

    if (!user) {
      return NextResponse.json({ 
        message: 'User not found in MongoDB', 
        query 
      }, { status: 404 });
    }

    // Initialize cashback collection
    const cashbackCol = db.collection('usermycashbacks');
    
    // Find all cashbacks for this user
    // Note: older mongo versions might store userId as string or ObjectId. 
    // We try to match both to be safe, or just the main one.
    // Based on migration script, it uses direct match.
    const cashbacks = await cashbackCol.find({ userId: user._id }).toArray();

    return NextResponse.json({ 
      message: 'User Data Retrieved Successfully',
      summary: {
          email: user.email,
          phone: user.phone,
          mongo_id: user._id,
          total_cashbacks: cashbacks.length,
          balance: user.balance
      },
      user_profile: user,
      cashback_history: cashbacks
    });

  } catch (error: any) {
    return NextResponse.json({ 
      error: 'Database connection failed', 
      details: error.message 
    }, { status: 500 });
  } finally {
    if (client) {
      await client.close();
    }
  }
}
