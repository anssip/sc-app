#!/usr/bin/env node

/**
 * Script to create a test user in Firebase Auth Emulator
 * Usage: node scripts/setup-emulator-user.js
 */

const fetch = require('node-fetch');

// Configuration
const AUTH_EMULATOR_HOST = 'localhost:9099';
const PROJECT_ID = 'spotcanvas-prod';

// User details - matching the production user
const TEST_USER = {
  email: 'anssip@gmail.com',
  password: 'testpassword123', // You can change this password
  displayName: 'Test User',
  emailVerified: true,
  uid: 'Nf1YGMLq7gbbe09zZl3q4qqchPY2' // Same UID as production for Firestore compatibility
};

async function createUser() {
  try {
    // Create user endpoint for Auth Emulator
    const signUpUrl = `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key`;

    console.log('Creating user in Auth Emulator...');

    // First, create the user
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: TEST_USER.email,
        password: TEST_USER.password,
        returnSecureToken: true
      })
    });

    if (!signUpResponse.ok) {
      const error = await signUpResponse.text();
      throw new Error(`Failed to create user: ${error}`);
    }

    const signUpData = await signUpResponse.json();
    console.log('✓ User created successfully');

    // Update user profile with display name and verified status
    const updateUrl = `http://${AUTH_EMULATOR_HOST}/identitytoolkit.googleapis.com/v1/accounts:update?key=fake-api-key`;

    const updateResponse = await fetch(updateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        idToken: signUpData.idToken,
        displayName: TEST_USER.displayName,
        emailVerified: TEST_USER.emailVerified,
        returnSecureToken: true
      })
    });

    if (!updateResponse.ok) {
      const error = await updateResponse.text();
      console.warn(`Warning: Could not update user profile: ${error}`);
    } else {
      console.log('✓ User profile updated');
    }

    // Note: The Auth Emulator doesn't support setting custom UIDs directly via REST API
    // The user will get a random UID, but we can work around this by:
    // 1. Using Admin SDK (requires a separate script)
    // 2. Or updating Firestore rules to work with any authenticated user

    console.log('\n==============================================');
    console.log('User created successfully in Auth Emulator!');
    console.log('==============================================');
    console.log(`Email: ${TEST_USER.email}`);
    console.log(`Password: ${TEST_USER.password}`);
    console.log(`UID: ${signUpData.localId} (Note: This is different from production UID)`);
    console.log('\nYou can now login with these credentials.');
    console.log('==============================================\n');

    // Create a helper script to import with correct UID
    console.log('To use the same UID as production, create an import file instead:');
    console.log('Run: node scripts/setup-emulator-user-import.js');

  } catch (error) {
    console.error('Error creating user:', error.message);

    if (error.message.includes('EMAIL_EXISTS')) {
      console.log('\nUser already exists. You can login with:');
      console.log(`Email: ${TEST_USER.email}`);
      console.log(`Password: ${TEST_USER.password}`);
    }

    process.exit(1);
  }
}

// Check if Auth Emulator is running
async function checkEmulator() {
  try {
    const response = await fetch(`http://${AUTH_EMULATOR_HOST}/`);
    if (!response.ok && response.status !== 404) {
      throw new Error('Auth Emulator not responding');
    }
    return true;
  } catch (error) {
    console.error('❌ Auth Emulator is not running on', AUTH_EMULATOR_HOST);
    console.log('Please start the emulators first:');
    console.log('  firebase emulators:start --only auth,firestore');
    process.exit(1);
  }
}

// Main execution
async function main() {
  console.log('Firebase Auth Emulator User Setup');
  console.log('==================================\n');

  await checkEmulator();
  await createUser();
}

main();
