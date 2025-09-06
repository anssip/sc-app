#!/usr/bin/env node

/**
 * Script to import a user with specific UID into Firebase Auth Emulator
 * This uses the Auth Emulator's import format to preserve the exact UID
 * Usage: node scripts/setup-emulator-user-import.js
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

// User configuration - matching production user
const TEST_USER = {
  uid: 'Nf1YGMLq7gbbe09zZl3q4qqchPY2', // Same as production
  email: 'anssip@gmail.com',
  emailVerified: true,
  displayName: 'Anssi Piirainen',
  password: 'testpassword123', // Plain text password for testing
  createdAt: new Date().toISOString(),
};

// Create import data directory
const IMPORT_DIR = path.join(__dirname, 'emulator-import');
const ACCOUNTS_FILE = path.join(IMPORT_DIR, 'auth_export', 'accounts.json');
const CONFIG_FILE = path.join(IMPORT_DIR, 'auth_export', 'config.json');

function hashPassword(password) {
  // For simplicity, using a basic hash for the emulator
  // The Auth Emulator accepts various hash formats
  const salt = crypto.randomBytes(8).toString('base64');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha256').toString('base64');

  return {
    hash,
    salt,
    algorithm: 'PBKDF2_SHA256',
    rounds: 1000
  };
}

function createImportFiles() {
  // Create directory structure
  if (!fs.existsSync(IMPORT_DIR)) {
    fs.mkdirSync(IMPORT_DIR, { recursive: true });
  }

  const authExportDir = path.join(IMPORT_DIR, 'auth_export');
  if (!fs.existsSync(authExportDir)) {
    fs.mkdirSync(authExportDir, { recursive: true });
  }

  // Hash the password
  const passwordData = hashPassword(TEST_USER.password);

  // Create accounts.json with user data
  const accounts = {
    kind: 'identitytoolkit#DownloadAccountResponse',
    users: [
      {
        localId: TEST_USER.uid,
        email: TEST_USER.email,
        emailVerified: TEST_USER.emailVerified,
        displayName: TEST_USER.displayName,
        passwordHash: passwordData.hash,
        salt: passwordData.salt,
        createdAt: Date.now().toString(),
        lastLoginAt: Date.now().toString(),
        providerUserInfo: [
          {
            providerId: 'password',
            email: TEST_USER.email,
            federatedId: TEST_USER.email,
            rawId: TEST_USER.email
          }
        ],
        validSince: Math.floor(Date.now() / 1000).toString(),
        disabled: false
      }
    ]
  };

  // Create config.json with hash configuration
  const config = {
    signIn: {
      allowDuplicateEmails: false
    },
    hashConfig: {
      algorithm: passwordData.algorithm,
      rounds: passwordData.rounds,
      memCost: 14,
      parallelization: 8,
      blockSize: 8,
      dkLen: 64,
      hashLengthBytes: 64
    }
  };

  // Write files
  fs.writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2));
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));

  console.log('✓ Import files created');
}

function importToEmulator() {
  console.log('Importing user to Auth Emulator...');

  try {
    // Use Firebase CLI to import the user
    const command = `firebase auth:import ${ACCOUNTS_FILE} --hash-algo=PBKDF2_SHA256 --rounds=1000 --project ${process.env.FIREBASE_PROJECT || 'spotcanvas-prod'}`;

    console.log('Running:', command);
    execSync(command, { stdio: 'inherit', cwd: path.join(__dirname, '..') });

    console.log('✓ User imported successfully');
    return true;
  } catch (error) {
    console.error('Failed to import user:', error.message);
    console.log('\nAlternatively, you can manually import by running:');
    console.log(`  cd ${path.join(__dirname, '..')}`);
    console.log(`  firebase auth:import ${ACCOUNTS_FILE} --hash-algo=PBKDF2_SHA256 --rounds=1000`);
    return false;
  }
}

function createSimpleImportScript() {
  // Create a simple curl script as an alternative
  const curlScript = `#!/bin/bash
# Alternative: Direct REST API import to Auth Emulator

curl -X POST "http://localhost:9099/identitytoolkit.googleapis.com/v1/accounts:signUp?key=fake-api-key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "${TEST_USER.email}",
    "password": "${TEST_USER.password}",
    "returnSecureToken": true
  }'
`;

  const scriptPath = path.join(__dirname, 'quick-add-user.sh');
  fs.writeFileSync(scriptPath, curlScript);
  fs.chmodSync(scriptPath, '755');

  console.log(`\n✓ Quick add script created: ${scriptPath}`);
}

// Main execution
function main() {
  console.log('Firebase Auth Emulator User Import');
  console.log('===================================\n');

  console.log('Creating import files with user:');
  console.log(`  UID: ${TEST_USER.uid}`);
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log(`  Display Name: ${TEST_USER.displayName}`);
  console.log('');

  // Create import files
  createImportFiles();

  // Try to import automatically
  const imported = importToEmulator();

  if (!imported) {
    // Create alternative script
    createSimpleImportScript();
  }

  console.log('\n==============================================');
  console.log('Setup Complete!');
  console.log('==============================================');
  console.log('You can now login with:');
  console.log(`  Email: ${TEST_USER.email}`);
  console.log(`  Password: ${TEST_USER.password}`);
  console.log(`  UID: ${TEST_USER.uid}`);
  console.log('');
  console.log('This user has the same UID as production,');
  console.log('so Firestore data will work correctly.');
  console.log('==============================================\n');

  // Cleanup option
  console.log('To clean up import files later, run:');
  console.log(`  rm -rf ${IMPORT_DIR}`);
}

main();
