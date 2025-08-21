Email Marketing Opt-in Flow Documentation for Customer.io

  Overview

  Our implementation follows email marketing best practices with explicit user consent and double opt-in verification through Firebase Authentication.

  Sign-up Flow with Marketing Consent

  1. User Registration Page (/signup)
    - User enters email and password
    - Explicit Marketing Consent Checkbox (optional): "I'd like to receive helpful tips, product updates, and exclusive offers"
    - Terms of Service Checkbox (required): User must accept Terms of Service and Privacy Policy
    - Marketing consent timestamp is recorded when checked
  2. Email Verification (/verify-email)
    - After signup, users are directed to a "check your inbox" page
    - Firebase sends automatic verification email
    - Users must verify their email address before accessing premium features
    - Resend functionality available with 60-second cooldown
  3. Post-Verification (/welcome)
    - Email verification status is tracked and updated in real-time
    - User data synced to Customer.io only after email verification
    - Marketing consent preference is passed to Customer.io

  Data Storage & Compliance

  Firestore Database Structure:
  users/{userId}: {
    email: string,
    marketingConsent: boolean,
    consentTimestamp: timestamp,
    emailVerified: boolean,
    createdAt: timestamp,
    verifiedAt: timestamp
  }

  Customer.io Integration Points

  1. User Identification - Triggered after email verification
  2. Event Tracking:
    - user_signed_up - With marketing_consent property
    - email_verified - When user verifies email
    - marketing_consent_updated - When user changes preference

  Consent Management

  - Opt-in: Explicit checkbox during signup (unchecked by default)
  - Opt-out: Users can update preferences anytime through account settings
  - Consent Tracking: Timestamp recorded for all consent changes
  - Email Verification: Required before any marketing emails are sent

  Security & Compliance

  - ✅ GDPR compliant with explicit consent
  - ✅ Double opt-in through email verification
  - ✅ Granular consent tracking with timestamps
  - ✅ Easy unsubscribe mechanism
  - ✅ Secure storage of user preferences in Firestore
  - ✅ Only verified email addresses receive marketing communications
