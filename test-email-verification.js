import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDkDBUUnxUqV3YZBm9GOrkcULZjBT4azyc",
  authDomain: "spotcanvas-prod.firebaseapp.com",
  projectId: "spotcanvas-prod",
  storageBucket: "spotcanvas-prod.firebasestorage.app",
  messagingSenderId: "346028322665",
  appId: "1:346028322665:web:f278b8364243d165f8d7f8",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

async function testEmailVerification() {
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  
  try {
    console.log('Creating test user:', testEmail);
    
    // Create a test user
    const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const user = userCredential.user;
    
    console.log('User created successfully');
    console.log('User email:', user.email);
    console.log('User emailVerified:', user.emailVerified);
    console.log('User UID:', user.uid);
    
    // Try to send verification email
    console.log('\nAttempting to send verification email...');
    
    await sendEmailVerification(user);
    
    console.log('✅ Verification email sent successfully!');
    console.log('Check the email at:', testEmail);
    
  } catch (error) {
    console.error('❌ Error:', error.code);
    console.error('Message:', error.message);
    
    if (error.code === 'auth/email-already-in-use') {
      console.log('\nTrying with a different email...');
      // Try again with different email
    }
  }
  
  process.exit(0);
}

testEmailVerification();