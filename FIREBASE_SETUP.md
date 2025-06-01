# Firebase Setup Instructions

## Prerequisites

Before setting up Firebase Authentication, you'll need:
- A Google account
- Node.js installed on your machine

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "spot-canvas-app")
4. Choose whether to enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Enable Authentication

1. In your Firebase project console, click on "Authentication" in the left sidebar
2. Click "Get started" if this is your first time
3. Go to the "Sign-in method" tab
4. Enable "Email/Password" authentication:
   - Click on "Email/Password"
   - Toggle "Enable" to ON
   - Click "Save"

## Step 3: Get Your Firebase Configuration

1. In the Firebase console, click on the gear icon (Project settings)
2. Scroll down to "Your apps" section
3. Click on the "</>" (Web) icon to add a web app
4. Enter an app nickname (e.g., "spot-canvas-web")
5. Click "Register app"
6. Copy the Firebase configuration object

## Step 4: Configure Your App

1. Open `sc-app/app/lib/firebase.ts`
2. Replace the placeholder values with your actual Firebase configuration:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## Step 5: Set Up Firestore (Optional)

If you plan to store user data:

1. In the Firebase console, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for development
4. Select a location for your database
5. Click "Done"

## Step 6: Test Your Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Navigate to `http://localhost:5173`
3. Click "Sign Up" to test user registration
4. Check the Firebase console under "Authentication" > "Users" to see registered users

## Security Rules (Production)

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## Environment Variables (Alternative Setup)

For better security in production, you can use environment variables:

1. Create a `.env` file in your project root
2. Add your Firebase configuration:
   ```
   FIREBASE_API_KEY=your_api_key
   FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   FIREBASE_PROJECT_ID=your_project_id
   FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   FIREBASE_APP_ID=your_app_id
   ```

3. Update `firebase.ts` to use environment variables (requires additional Remix configuration)

## Troubleshooting

### Common Issues:

1. **"Firebase: Error (auth/configuration-not-found)"**
   - Check that your Firebase configuration is correct
   - Ensure you've enabled Email/Password authentication

2. **"Firebase: Error (auth/network-request-failed)"**
   - Check your internet connection
   - Verify your Firebase project is active

3. **CORS errors**
   - Add your development domain to Firebase's authorized domains
   - Go to Authentication > Settings > Authorized domains

### Getting Help

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firebase Authentication Guide](https://firebase.google.com/docs/auth)
- [Remix Documentation](https://remix.run/docs)