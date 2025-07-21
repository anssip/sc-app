#!/usr/bin/env bun

// Test script to check if we can read indicators from Firestore
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

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

async function testIndicatorsRead() {
  console.log('📊 Testing Indicators Read Access');
  console.log('='.repeat(50));

  const { db } = await getFirebaseConfig();

  try {
    console.log('\n📖 Attempting to read indicators collection...');

    const indicatorsRef = collection(db, 'indicators');
    const q = query(indicatorsRef, orderBy('name', 'asc'));

    console.log('🔍 Executing query...');
    const querySnapshot = await getDocs(q);

    console.log(`📄 Found ${querySnapshot.size} indicators`);

    if (querySnapshot.size > 0) {
      console.log('\n📋 Indicators found:');
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log(`  • ${doc.id}: ${data.name || 'Unknown'} (${data.display || 'Unknown display'})`);
      });
    } else {
      console.log('\n⚠️  No indicators found in the collection.');
      console.log('   This could mean:');
      console.log('   1. The collection is empty');
      console.log('   2. The documents don\'t exist yet');
      console.log('   3. There might still be permission issues');
    }

    console.log('\n✅ Read access test completed successfully!');
    console.log('   The Firestore rules are working correctly for reading.');

  } catch (error) {
    console.error('\n❌ Error reading indicators:', error);

    if (error.code === 'permission-denied') {
      console.log('\n🔒 Permission denied. This suggests:');
      console.log('   1. Firestore rules might not be deployed correctly');
      console.log('   2. The rule pattern might not match the query');
      console.log('   3. Authentication might be required but not provided');
    } else {
      console.log('\n🔧 Other error occurred. Check your internet connection and Firebase project settings.');
    }

    process.exit(1);
  }
}

// Run the test
testIndicatorsRead().catch(console.error);
