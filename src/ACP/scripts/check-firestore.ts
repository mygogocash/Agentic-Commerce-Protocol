
import { shopeeService } from '../shopee';
import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyFirestore() {
  console.log('🔥 Checking Firebase Firestore...');
  
  if (!process.env.GOOGLE_APPLICATION_CREDENTIALS && !process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    console.warn('⚠️  No GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_PATH set.');
    console.warn('   This might fail if standard Application Default Credentials are not set up.');
  }

  try {
    // 1. Check Search
    console.log('\n🔎 Testing Search Strategy (Firestore)...');
    // Using a generic term to hopefully get results
    const results = await shopeeService.search('phone');
    
    console.log(`   Found ${results.length} results.`);
    if (results.length > 0) {
      console.log('   Sample:', JSON.stringify(results[0], null, 2));
    } else {
      console.log('   (If this is expected to be empty initially, then this is OK)');
    }

  } catch (error) {
    console.error('❌ Verification Error:', error);
  }
}

verifyFirestore();
