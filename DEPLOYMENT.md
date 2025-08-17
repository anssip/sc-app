# Firebase Deployment Guide

This guide explains how to deploy the Spot Canvas app to Firebase Hosting with Cloud Functions for server-side rendering.

## Prerequisites

1. Firebase CLI installed (`npm install -g firebase-tools`)
2. Logged into Firebase (`firebase login`)
3. Environment variables configured in `.env` file

## Project Structure

```
sc-app/
├── build/              # Remix build output
│   ├── client/        # Static assets (served by Firebase Hosting)
│   └── server/        # Server bundle (used by Cloud Function)
├── functions/         # Firebase Cloud Functions
│   ├── index.js       # Cloud Function entry point
│   ├── package.json   # Function dependencies
│   └── build/         # Copy of build directory (deployed with function)
├── firebase.json      # Firebase configuration
└── .firebaserc       # Firebase project configuration
```

**Important**: The build directory is copied to the functions folder during deployment so the Cloud Function can access the server bundle.

## Deployment Commands

### Full Deployment (Hosting + Functions)
```bash
bun run deploy
```
This will:
1. Build the Remix app
2. Copy build files to functions directory
3. Copy the local sc-charts package to functions
4. Install function dependencies
5. Deploy both hosting and functions to Firebase

### Deploy Hosting Only
```bash
bun run deploy:hosting
```
Use this when you've only changed static assets or client-side code.

### Deploy Functions Only
```bash
bun run deploy:functions
```
Use this when you've only changed server-side code or function configuration.

## How It Works

1. **Static Assets**: Firebase Hosting serves all static files from `build/client/`
2. **Dynamic Routes**: All requests are rewritten to the `remix` Cloud Function
3. **SSR**: The Cloud Function runs the Remix server build to generate HTML
4. **API Routes**: Handled by the same Cloud Function through Remix loaders/actions

## Configuration

### Memory and Timeout
Edit `functions/index.js` to adjust:
- `memory`: Default is 512MB (can be 128MB to 8GB)
- `timeoutSeconds`: Default is 60 seconds (max 540)
- `maxInstances`: Default is 100

### Region
The default region is `us-central1`. Change it in `functions/index.js`:
```javascript
region: 'europe-west1', // or your preferred region
```

## Environment Variables

Production environment variables should be set in Firebase:
```bash
firebase functions:config:set someservice.key="THE API KEY"
```

Access them in your functions:
```javascript
const functions = require('firebase-functions')
const apiKey = functions.config().someservice.key
```

## Monitoring

View function logs:
```bash
firebase functions:log
```

Or in the Firebase Console under Functions > Logs.

## First-Time Setup

### Setting Function Permissions

After your first deployment, you need to make the Cloud Function publicly accessible:

#### Option 1: Using gcloud CLI
```bash
bash scripts/set-function-permissions.sh
```

#### Option 2: Using Firebase Console
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project (spotcanvas-prod)
3. Navigate to Cloud Functions
4. Click on the `remix` function
5. Click "Permissions" tab
6. Click "Add Principal"
7. Enter `allUsers` in the "New principals" field
8. Select role: `Cloud Functions > Cloud Functions Invoker`
9. Click "Save"

#### Option 3: Using Firebase CLI (v2 functions)
The function is configured with `invoker: 'public'` which should automatically set permissions on deployment.

## Troubleshooting

### Function Deploy Fails
- Check Node.js version matches (currently set to Node 20)
- Ensure all dependencies are listed in `functions/package.json`
- Check function logs for runtime errors

### SSR Not Working
- Verify the function is deployed: `firebase functions:list`
- Check rewrites in `firebase.json`
- View function logs for errors

### Static Assets 404
- Ensure `bun run build` was run before deployment
- Check that `build/client` exists and contains assets
- Verify `public` setting in `firebase.json`

## Local Testing

Run Firebase emulators:
```bash
bun run firebase:emulators
```

This will start local emulators for:
- Hosting (http://localhost:5000)
- Functions (http://localhost:5001)
- Firestore (if configured)