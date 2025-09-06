#!/bin/bash

# Script to start Firebase emulators and automatically add test user
# Usage: ./scripts/start-emulators-with-user.sh

echo "🚀 Starting Firebase Emulators with test user setup..."
echo "=================================================="

# Start emulators in background
echo "Starting Auth and Firestore emulators..."
firebase emulators:start --only auth,firestore &
EMULATOR_PID=$!

# Wait for emulators to be ready
echo "Waiting for emulators to start..."
sleep 5

# Check if emulators are running
if ! curl -s http://localhost:9099/ > /dev/null 2>&1; then
    echo "❌ Failed to start emulators"
    exit 1
fi

echo "✅ Emulators started successfully"

# Add test user
echo ""
echo "Adding test user to Auth emulator..."
node scripts/add-emulator-user.mjs

echo ""
echo "=================================================="
echo "✅ Setup complete!"
echo "=================================================="
echo "Emulators are running with test user:"
echo "  Email: anssip@gmail.com"
echo "  Password: testpassword123"
echo ""
echo "Emulator UI: http://localhost:4000"
echo "App URL: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop emulators"
echo "=================================================="

# Keep emulators running
wait $EMULATOR_PID
