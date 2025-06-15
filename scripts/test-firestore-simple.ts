#!/usr/bin/env bun

// Simple Firestore test script that imports from the existing app
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

// Import Firebase config from the app
async function getFirebaseConfig() {
  try {
    // Try to import the Firebase config from the app
    const { db, auth } = await import('../app/lib/firebase');
    const { signInWithEmailAndPassword } = await import('firebase/auth');
    return { db, auth, signInWithEmailAndPassword };
  } catch (error) {
    console.error('Failed to import Firebase config from app:', error);
    console.log('Make sure you are running this from the sc-app directory');
    process.exit(1);
  }
}

async function main() {
  console.log('🔥 Simple Firestore Test');
  console.log('='.repeat(40));

  const { db, auth, signInWithEmailAndPassword } = await getFirebaseConfig();

  // Get credentials from command line or env
  const email = process.env.TEST_EMAIL || Bun.argv[2];
  const password = process.env.TEST_PASSWORD || Bun.argv[3];

  if (!email || !password) {
    console.log('❌ Please provide email and password');
    console.log('Usage: bun run scripts/test-firestore-simple.ts <email> <password>');
    console.log('Or set TEST_EMAIL and TEST_PASSWORD environment variables');
    process.exit(1);
  }

  try {
    // Authenticate
    console.log(`🔐 Authenticating as: ${email}`);
    await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ Authentication successful');

    // Test 1: List exchanges
    console.log('\n📁 Testing exchanges collection...');
    const exchangesRef = collection(db, 'exchanges');
    const exchangesSnapshot = await getDocs(exchangesRef);
    console.log(`   Found ${exchangesSnapshot.docs.length} exchanges`);

    if (exchangesSnapshot.docs.length > 0) {
      exchangesSnapshot.docs.forEach(doc => {
        console.log(`   - ${doc.id}`);
      });
    } else {
      console.log('   ⚠️  No exchanges found - this might be a permissions issue');
    }

    // Test 2: Check coinbase specifically
    console.log('\n📄 Testing coinbase exchange...');
    const coinbaseRef = doc(db, 'exchanges', 'coinbase');
    const coinbaseDoc = await getDoc(coinbaseRef);

    if (coinbaseDoc.exists()) {
      console.log('   ✅ Coinbase exchange document exists');
    } else {
      console.log('   ❌ Coinbase exchange document not found');
    }

    // Test 3: List coinbase products
    console.log('\n📊 Testing coinbase products...');
    const productsRef = collection(db, 'exchanges', 'coinbase', 'products');
    const productsSnapshot = await getDocs(productsRef);
    console.log(`   Found ${productsSnapshot.docs.length} products`);

    if (productsSnapshot.docs.length > 0) {
      console.log('   First 5 products:');
      productsSnapshot.docs.slice(0, 5).forEach(doc => {
        console.log(`   - ${doc.id}`);
      });
    } else {
      console.log('   ⚠️  No products found - this might be a permissions issue');
    }

    // Test 4: Test a specific product
    console.log('\n₿ Testing BTC-USD product...');
    const btcRef = doc(db, 'exchanges', 'coinbase', 'products', 'BTC-USD');
    const btcDoc = await getDoc(btcRef);

    if (btcDoc.exists()) {
      console.log('   ✅ BTC-USD product exists');
      const data = btcDoc.data();
      if (data) {
        console.log(`   Symbol: ${data.symbol || 'N/A'}`);
        console.log(`   Base: ${data.baseAsset || 'N/A'}`);
        console.log(`   Quote: ${data.quoteAsset || 'N/A'}`);
      }
    } else {
      console.log('   ❌ BTC-USD product not found');
    }

    // Test 5: Test settings access
    console.log('\n⚙️  Testing settings access...');
    const settingsRef = doc(db, 'settings', email);
    const settingsDoc = await getDoc(settingsRef);
    console.log(`   Settings document exists: ${settingsDoc.exists()}`);

    console.log('\n✅ All tests completed!');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);

    if (error.code) {
      console.error(`   Error code: ${error.code}`);
    }

    if (error.code === 'permission-denied') {
      console.log('\n💡 This looks like a Firestore rules permission issue.');
      console.log('   Make sure your firestore.rules file has been deployed with:');
      console.log('   firebase deploy --only firestore:rules');
    }

    process.exit(1);
  }
}

main().catch(console.error);
