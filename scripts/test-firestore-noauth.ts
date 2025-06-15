#!/usr/bin/env bun

// Test script that checks Firestore access without authentication
// This will help us determine if the issue is with authentication or permissions
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

async function getFirebaseConfig() {
  try {
    // Import the Firebase config from the app
    const { db } = await import('../app/lib/firebase');
    return { db };
  } catch (error) {
    console.error('Failed to import Firebase config from app:', error);
    console.log('Make sure you are running this from the sc-app directory');
    process.exit(1);
  }
}

async function main() {
  console.log('🔥 Firestore Test (No Authentication)');
  console.log('Testing public data access without authentication');
  console.log('='.repeat(50));

  const { db } = await getFirebaseConfig();

  try {
    // Test 1: Try to access exchanges collection (should be public according to rules)
    console.log('\n📁 Test 1: Accessing exchanges collection (public)...');

    try {
      const exchangesRef = collection(db, 'exchanges');
      const exchangesSnapshot = await getDocs(exchangesRef);
      console.log(`✅ Successfully accessed exchanges collection`);
      console.log(`   Found ${exchangesSnapshot.docs.length} exchanges`);

      if (exchangesSnapshot.docs.length > 0) {
        exchangesSnapshot.docs.forEach(doc => {
          console.log(`   - Exchange: ${doc.id}`);
          const data = doc.data();
          if (data && Object.keys(data).length > 0) {
            console.log(`     Data keys: ${Object.keys(data).join(', ')}`);
          }
        });
      } else {
        console.log('   ⚠️  No exchanges found - collection might be empty');
      }
    } catch (error: any) {
      console.error('❌ Failed to access exchanges collection:', error.message);
      console.error(`   Error code: ${error.code}`);

      if (error.code === 'permission-denied') {
        console.log('   💡 Permission denied - check firestore.rules for exchanges collection');
      }
    }

    // Test 2: Try to access coinbase exchange document specifically
    console.log('\n📄 Test 2: Accessing coinbase exchange document...');

    try {
      const coinbaseRef = doc(db, 'exchanges', 'coinbase');
      const coinbaseDoc = await getDoc(coinbaseRef);

      if (coinbaseDoc.exists()) {
        console.log('✅ Coinbase exchange document exists');
        const data = coinbaseDoc.data();
        if (data) {
          console.log(`   Document has ${Object.keys(data).length} fields`);
          console.log(`   Fields: ${Object.keys(data).join(', ')}`);
        }
      } else {
        console.log('⚠️  Coinbase exchange document does not exist');
        console.log('   This could mean:');
        console.log('   - The document really doesn\'t exist');
        console.log('   - We don\'t have permission to see it');
      }
    } catch (error: any) {
      console.error('❌ Failed to access coinbase exchange:', error.message);
      console.error(`   Error code: ${error.code}`);
    }

    // Test 3: Try to access products collection
    console.log('\n📊 Test 3: Accessing coinbase products collection...');

    try {
      const productsRef = collection(db, 'exchanges', 'coinbase', 'products');
      const productsSnapshot = await getDocs(productsRef);
      console.log(`✅ Successfully accessed products collection`);
      console.log(`   Found ${productsSnapshot.docs.length} products`);

      if (productsSnapshot.docs.length > 0) {
        console.log('   First 5 products:');
        productsSnapshot.docs.slice(0, 5).forEach(doc => {
          console.log(`   - ${doc.id}`);
        });

        if (productsSnapshot.docs.length > 5) {
          console.log(`   ... and ${productsSnapshot.docs.length - 5} more products`);
        }
      } else {
        console.log('   ⚠️  No products found');
      }
    } catch (error: any) {
      console.error('❌ Failed to access products collection:', error.message);
      console.error(`   Error code: ${error.code}`);
    }

    // Test 4: Try to access a specific product
    console.log('\n₿ Test 4: Accessing BTC-USD product document...');

    try {
      const btcRef = doc(db, 'exchanges', 'coinbase', 'products', 'BTC-USD');
      const btcDoc = await getDoc(btcRef);

      if (btcDoc.exists()) {
        console.log('✅ BTC-USD product document exists');
        const data = btcDoc.data();
        if (data) {
          console.log(`   Symbol: ${data.symbol || 'N/A'}`);
          console.log(`   Base Asset: ${data.baseAsset || 'N/A'}`);
          console.log(`   Quote Asset: ${data.quoteAsset || 'N/A'}`);
          if (data.lastUpdate) {
            console.log(`   Last Update: ${data.lastUpdate.toDate ? data.lastUpdate.toDate() : data.lastUpdate}`);
          }
        }
      } else {
        console.log('⚠️  BTC-USD product document does not exist');
      }
    } catch (error: any) {
      console.error('❌ Failed to access BTC-USD product:', error.message);
      console.error(`   Error code: ${error.code}`);
    }

    // Test 5: Try to access trading_pairs (if it exists)
    console.log('\n📈 Test 5: Accessing trading_pairs collection...');

    try {
      const tradingPairsRef = collection(db, 'trading_pairs');
      const tradingPairsSnapshot = await getDocs(tradingPairsRef);
      console.log(`✅ Successfully accessed trading_pairs collection`);
      console.log(`   Found ${tradingPairsSnapshot.docs.length} trading pairs`);
    } catch (error: any) {
      console.error('❌ Failed to access trading_pairs collection:', error.message);
      console.error(`   Error code: ${error.code}`);
    }

    // Test 6: Try to access settings (should fail without auth)
    console.log('\n⚙️  Test 6: Accessing settings collection (should fail)...');

    try {
      const settingsRef = collection(db, 'settings');
      const settingsSnapshot = await getDocs(settingsRef);
      console.log('⚠️  Unexpectedly accessed settings collection without auth');
      console.log(`   Found ${settingsSnapshot.docs.length} documents`);
    } catch (error: any) {
      console.log('✅ Settings collection correctly denied without authentication');
      console.log(`   Error: ${error.message}`);
    }

    console.log('\n🎯 TEST SUMMARY');
    console.log('='.repeat(50));
    console.log('This test helps determine:');
    console.log('• If Firestore rules are deployed correctly');
    console.log('• If the exchanges collection has proper permissions');
    console.log('• If the data actually exists in Firestore');
    console.log('• If the issue is authentication vs. permissions');
    console.log('\nIf all tests pass, the issue is likely with authentication in the app.');
    console.log('If tests fail, the issue is with Firestore rules or missing data.');

  } catch (error: any) {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  }
}

main().catch(console.error);
