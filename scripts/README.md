# Firebase Emulator Scripts

This directory contains scripts to help set up and manage Firebase emulators for local development.

## Available Scripts

### `add-emulator-user.mjs`
Adds a test user to the Firebase Auth emulator with the same UID as production for Firestore compatibility. Also creates a Starter subscription in Firestore.

**Usage:**
```bash
node scripts/add-emulator-user.mjs
```

**Test User Credentials:**
- Email: `anssip@gmail.com`
- Password: `testpassword123`
- UID: `Nf1YGMLq7gbbe09zZl3q4qqchPY2` (matches production)

**Subscription Details:**
- Plan: Starter
- Status: Active
- Trial: 7 days
- Subscription ID: `sub_1Rr0DXS4gOnN3XylBwrkqkl8`

### `start-emulators-with-user.sh`
Starts the Firebase emulators and automatically adds the test user.

**Usage:**
```bash
./scripts/start-emulators-with-user.sh
```

This script will:
1. Start Auth and Firestore emulators
2. Wait for them to be ready
3. Automatically add the test user
4. Keep the emulators running

## Manual Setup

If you prefer to set things up manually:

1. **Start the emulators:**
   ```bash
   firebase emulators:start --only auth,firestore
   ```

2. **Add the test user (in a new terminal):**
   ```bash
   node scripts/add-emulator-user.mjs
   ```

3. **Login to the app:**
   - Navigate to http://localhost:5173
   - Use the test credentials above

## Important Notes

- The test user has the same UID as the production user, ensuring Firestore data compatibility
- The Auth emulator runs on port 9099
- The Firestore emulator runs on port 8090
- Emulator UI is available at http://localhost:4000
- All emulator data is cleared when the emulators are stopped

## Troubleshooting

**If you get "port already in use" errors:**
```bash
# Kill all Firebase processes
pkill -f firebase

# Then restart
./scripts/start-emulators-with-user.sh
```

**If authentication fails:**
- Make sure both Auth and Firestore emulators are running
- Check that the app is configured to use emulators in development mode
- Clear browser localStorage: `localStorage.removeItem('firebase-emulator-warning')`