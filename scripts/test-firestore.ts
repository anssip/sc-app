#!/usr/bin/env bun

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Firebase configuration - you'll need to update this with your actual config
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "your-api-key",
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test email and password (you can pass these as command line args)
const TEST_EMAIL = process.env.TEST_EMAIL || Bun.argv[2];
const TEST_PASSWORD = process.env.TEST_PASSWORD || Bun.argv[3];

interface TestResult {
  name: string;
  success: boolean;
  result?: string;
  error?: string;
  count?: number;
}

async function authenticateUser(): Promise<boolean> {
  if (!TEST_EMAIL || !TEST_PASSWORD) {
    console.log('❌ No test credentials provided');
    console.log('Usage: bun run scripts/test-firestore.ts <email> <password>');
    console.log('Or set TEST_EMAIL and TEST_PASSWORD environment variables');
    return false;
  }

  try {
    console.log(`🔐 Authenticating with email: ${TEST_EMAIL}`);
    const userCredential = await signInWithEmailAndPassword(auth, TEST_EMAIL, TEST_PASSWORD);
    console.log(`✅ Successfully authenticated as: ${userCredential.user.email}`);
    console.log(`   User UID: ${userCredential.user.uid}`);
    return true;
  } catch (error) {
    console.error('❌ Authentication failed:', error);
    return false;
  }
}

async function testFirestoreAccess(): Promise<TestResult[]> {
  console.log('\n🔍 Starting Firestore access tests...\n');

  const results: TestResult[] = [];

  // Test 1: List exchanges collection
  try {
    console.log('📁 Test 1: Listing exchanges collection');
    const exchangesRef = collection(db, 'exchanges');
    const exchangesSnapshot = await getDocs(exchangesRef);

    const exchanges = exchangesSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${exchanges.length} exchanges: ${exchanges.join(', ')}`);

    results.push({
      name: 'List Exchanges',
      success: true,
      count: exchanges.length,
      result: `Found exchanges: ${exchanges.join(', ')}`
    });
  } catch (error) {
    console.error('❌ Failed to list exchanges:', error);
    results.push({
      name: 'List Exchanges',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: Read specific exchange document
  try {
    console.log('\n📄 Test 2: Reading coinbase exchange document');
    const coinbaseRef = doc(db, 'exchanges', 'coinbase');
    const coinbaseDoc = await getDoc(coinbaseRef);

    if (coinbaseDoc.exists()) {
      console.log('✅ Coinbase exchange document exists');
      console.log('   Data:', JSON.stringify(coinbaseDoc.data(), null, 2));
      results.push({
        name: 'Read Coinbase Exchange',
        success: true,
        result: 'Document exists with data'
      });
    } else {
      console.log('⚠️  Coinbase exchange document does not exist');
      results.push({
        name: 'Read Coinbase Exchange',
        success: false,
        error: 'Document does not exist'
      });
    }
  } catch (error) {
    console.error('❌ Failed to read coinbase exchange:', error);
    results.push({
      name: 'Read Coinbase Exchange',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 3: List coinbase products
  try {
    console.log('\n📁 Test 3: Listing coinbase products');
    const productsRef = collection(db, 'exchanges', 'coinbase', 'products');
    const productsSnapshot = await getDocs(productsRef);

    const products = productsSnapshot.docs.map(doc => doc.id);
    console.log(`✅ Found ${products.length} products`);

    if (products.length > 0) {
      console.log(`   First 10 products: ${products.slice(0, 10).join(', ')}`);
      if (products.length > 10) {
        console.log(`   ... and ${products.length - 10} more`);
      }
    }

    results.push({
      name: 'List Coinbase Products',
      success: true,
      count: products.length,
      result: `Found ${products.length} products`
    });
  } catch (error) {
    console.error('❌ Failed to list coinbase products:', error);
    results.push({
      name: 'List Coinbase Products',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 4: Read specific product
  try {
    console.log('\n📄 Test 4: Reading BTC-USD product');
    const btcRef = doc(db, 'exchanges', 'coinbase', 'products', 'BTC-USD');
    const btcDoc = await getDoc(btcRef);

    if (btcDoc.exists()) {
      console.log('✅ BTC-USD product document exists');
      const data = btcDoc.data();
      console.log('   Data:', JSON.stringify(data, null, 2));
      results.push({
        name: 'Read BTC-USD Product',
        success: true,
        result: 'Document exists with data'
      });
    } else {
      console.log('⚠️  BTC-USD product document does not exist');
      results.push({
        name: 'Read BTC-USD Product',
        success: false,
        error: 'Document does not exist'
      });
    }
  } catch (error) {
    console.error('❌ Failed to read BTC-USD product:', error);
    results.push({
      name: 'Read BTC-USD Product',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 5: Test settings collection access
  try {
    console.log('\n⚙️  Test 5: Testing settings collection access');
    const user = auth.currentUser;
    if (!user?.email) {
      throw new Error('No authenticated user email');
    }

    const settingsRef = doc(db, 'settings', user.email);
    const settingsDoc = await getDoc(settingsRef);

    console.log(`✅ Settings access test completed`);
    console.log(`   Document exists: ${settingsDoc.exists()}`);

    results.push({
      name: 'Test Settings Access',
      success: true,
      result: `Settings document ${settingsDoc.exists() ? 'exists' : 'does not exist'}`
    });
  } catch (error) {
    console.error('❌ Failed to access settings:', error);
    results.push({
      name: 'Test Settings Access',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  return results;
}

function printSummary(results: TestResult[]) {
  console.log('\n📊 TEST SUMMARY');
  console.log('='.repeat(50));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`Total tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log('');

  results.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const info = result.success
      ? (result.count !== undefined ? ` (${result.count} items)` : '')
      : ` - ${result.error}`;

    console.log(`${status} ${result.name}${info}`);
  });

  if (failed > 0) {
    console.log('\n🚨 FAILED TESTS DETAILS:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.name}: ${result.error}`);
    });
  }

  console.log('\n' + '='.repeat(50));
}

async function main() {
  console.log('🔥 Firebase Firestore Access Test');
  console.log('='.repeat(50));

  // Check if we're using the emulator
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    console.log(`🧪 Using Firestore emulator: ${process.env.FIRESTORE_EMULATOR_HOST}`);
  }

  // Authenticate user
  const authenticated = await authenticateUser();
  if (!authenticated) {
    process.exit(1);
  }

  // Run tests
  const results = await testFirestoreAccess();

  // Print summary
  printSummary(results);

  // Exit with appropriate code
  const hasFailures = results.some(r => !r.success);
  process.exit(hasFailures ? 1 : 0);
}

// Run the test
main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
