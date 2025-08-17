#!/bin/bash

# Prepare functions directory for deployment
echo "Preparing functions for deployment..."

# Build the Remix app
echo "Building Remix app..."
bun run build

# Copy build directory to functions
echo "Copying build files to functions..."
cp -r build functions/

# Copy the local sc-charts package to functions
echo "Copying sc-charts package..."
mkdir -p functions/rs-charts
cp -r ../rs-charts/* functions/rs-charts/ 2>/dev/null || true

# Install dependencies
echo "Installing function dependencies..."
cd functions
npm install
cd ..

echo "Functions prepared successfully!"