#!/usr/bin/env node

import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator, collection, getDocs, query, where } from 'firebase/firestore';

// Initialize Firebase with emulator
const app = initializeApp({
  projectId: 'spotcanvas-prod'
});

const db = getFirestore(app);

// Connect to emulator if not already connected
if (!db._settings?.host?.includes('localhost')) {
  connectFirestoreEmulator(db, 'localhost', 8090);
}

async function checkCommands() {
  console.log('Checking Firestore for chart commands...\n');

  const userId = 'test-user-workflow';

  try {
    // Get all commands for the test user
    const commandsRef = collection(db, 'users', userId, 'chart_commands');
    const snapshot = await getDocs(commandsRef);

    console.log(`Found ${snapshot.size} commands for user ${userId}:\n`);

    snapshot.forEach(doc => {
      const data = doc.data();
      console.log(`Command ID: ${doc.id}`);
      console.log(`  Command: ${data.command}`);
      console.log(`  Status: ${data.status}`);
      console.log(`  Session: ${data.sessionId}`);
      console.log(`  Parameters:`, data.parameters);
      console.log(`  Timestamp:`, data.timestamp?.toDate?.() || data.timestamp);
      console.log('---');
    });

    // Check for pending commands specifically
    const pendingQuery = query(commandsRef, where('status', '==', 'pending'));
    const pendingSnapshot = await getDocs(pendingQuery);

    console.log(`\n${pendingSnapshot.size} commands are still pending`);

  } catch (error) {
    console.error('Error checking commands:', error);
  }

  process.exit(0);
}

checkCommands();
