# Firebase Authentication for Backend Services

## Overview

This document describes how to use Firebase Authentication to secure backend API endpoints, specifically for protecting a Stripe billing management service. The approach uses Firebase ID tokens to authenticate and authorize API requests from the frontend to backend services.

## Architecture

```
┌─────────────┐     ID Token      ┌──────────────┐     Verify Token   ┌─────────────────┐
│   Frontend  │ ──────────────>   │   Backend    │ ──────────────>    │ Firebase Admin  │
│ (React App) │                   │   Service    │                    │      SDK        │
└─────────────┘                   └──────────────┘                    └─────────────────┘
      │                                  │                                      │
      │                                  │                                      │
      └──────── Firebase Auth ───────────┴───────────── Stripe API ─────────────┘
```

## Client-Side Implementation

### Getting the ID Token

```typescript
import { auth } from "./lib/firebase";

// Get the current user's ID token
const getIdToken = async (): Promise<string | null> => {
  const user = auth.currentUser;
  if (!user) return null;

  try {
    // Force refresh to ensure token is valid
    const token = await user.getIdToken(true);
    return token;
  } catch (error) {
    console.error("Error getting ID token:", error);
    return null;
  }
};
```

### Making Authenticated API Calls

```typescript
// API client with authentication
class AuthenticatedAPIClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  async request(endpoint: string, options: RequestInit = {}) {
    const token = await getIdToken();

    if (!token) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    if (response.status === 401) {
      // Token might be expired, try refreshing
      const newToken = await getIdToken();
      if (newToken) {
        // Retry with new token
        return fetch(`${this.baseURL}${endpoint}`, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
            "Content-Type": "application/json",
          },
        });
      }
    }

    return response;
  }
}

// Usage example
const billingAPI = new AuthenticatedAPIClient(
  "https://api.yourdomain.com/billing"
);

// Create a Stripe checkout session
const createCheckoutSession = async (priceId: string) => {
  const response = await billingAPI.request("/create-checkout-session", {
    method: "POST",
    body: JSON.stringify({ priceId }),
  });

  if (!response.ok) {
    throw new Error("Failed to create checkout session");
  }

  return response.json();
};
```

## Backend Implementation

### Setting Up Firebase Admin SDK

```javascript
// Node.js/Express backend example
const admin = require("firebase-admin");
const express = require("express");

// Initialize Firebase Admin
admin.initializeApp({
  credential: admin.credential.applicationDefault(),
  projectId: "your-project-id",
});

const app = express();
```

### Authentication Middleware

```javascript
// Middleware to verify Firebase ID tokens
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: "No token provided" });
  }

  try {
    // Verify the ID token
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Add user info to request object
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified,
      customClaims: decodedToken.customClaims || {},
    };

    next();
  } catch (error) {
    console.error("Token verification failed:", error);

    if (error.code === "auth/id-token-expired") {
      return res.status(401).json({ error: "Token expired" });
    }

    return res.status(403).json({ error: "Invalid token" });
  }
};

// Apply middleware to protected routes
app.use("/billing/*", authenticateToken);
```

### Stripe Integration Example

```javascript
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Map Firebase UID to Stripe Customer
const getOrCreateStripeCustomer = async (firebaseUser) => {
  // Check if customer already exists in your database
  const existingCustomer = await db
    .collection("customers")
    .where("firebaseUid", "==", firebaseUser.uid)
    .get();

  if (!existingCustomer.empty) {
    return existingCustomer.docs[0].data().stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email: firebaseUser.email,
    metadata: {
      firebaseUid: firebaseUser.uid,
    },
  });

  // Save to database
  await db.collection("customers").add({
    firebaseUid: firebaseUser.uid,
    stripeCustomerId: customer.id,
    createdAt: new Date(),
  });

  return customer.id;
};

// Protected billing endpoint
app.post("/billing/create-checkout-session", async (req, res) => {
  try {
    const { priceId } = req.body;
    const customerId = await getOrCreateStripeCustomer(req.user);

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${process.env.FRONTEND_URL}/billing/success`,
      cancel_url: `${process.env.FRONTEND_URL}/billing/cancel`,
    });

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: "Failed to create checkout session" });
  }
});
```

## Security Best Practices

### 1. Token Verification

- Always verify ID tokens on the backend using Firebase Admin SDK
- Never trust client-provided user information without verification
- Handle token expiration gracefully

### 2. HTTPS Only

- Always use HTTPS for API calls containing authentication tokens
- Never send tokens over unencrypted connections

### 3. Token Storage

- Never store ID tokens in localStorage (use memory only)
- Refresh tokens before they expire (1 hour lifetime)
- Clear tokens on logout

### 4. Rate Limiting

```javascript
const rateLimit = require("express-rate-limit");

const billingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each user to 10 requests per windowMs
  keyGenerator: (req) => req.user.uid, // rate limit by Firebase UID
});

app.use("/billing/*", billingLimiter);
```

### 5. CORS Configuration

```javascript
const cors = require("cors");

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
```

## Role-Based Access Control (Optional)

### Setting Custom Claims

```javascript
// Admin function to set user roles
const setUserRole = async (uid, role) => {
  await admin.auth().setCustomUserClaims(uid, { role });
};

// Example: Set premium user role
await setUserRole("user-uid-123", "premium");
```

### Checking Roles in Middleware

```javascript
const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user.customClaims || req.user.customClaims.role !== role) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }
    next();
  };
};

// Protected admin endpoint
app.get(
  "/billing/admin/stats",
  authenticateToken,
  requireRole("admin"),
  (req, res) => {
    // Admin only endpoint
  }
);
```

## Error Handling

### Client-Side Error Handler

```typescript
const handleAPIError = (error: any) => {
  if (error.response) {
    switch (error.response.status) {
      case 401:
        // Token expired or invalid - redirect to login
        window.location.href = "/signin";
        break;
      case 403:
        // Forbidden - insufficient permissions
        console.error("Access denied");
        break;
      case 429:
        // Rate limited
        console.error("Too many requests");
        break;
      default:
        console.error("API error:", error.response.data);
    }
  } else {
    console.error("Network error:", error);
  }
};
```

### Backend Error Responses

```javascript
// Consistent error response format
const sendError = (res, status, message, code = null) => {
  res.status(status).json({
    error: {
      message,
      code,
      timestamp: new Date().toISOString(),
    },
  });
};

// Usage
sendError(res, 401, "Authentication required", "AUTH_REQUIRED");
```

## Testing

### Testing Authenticated Endpoints

```javascript
// Jest test example
const request = require("supertest");

describe("Billing API", () => {
  let authToken;

  beforeAll(async () => {
    // Get a test user token
    const testUser = await admin.auth().createCustomToken("test-user-uid");
    authToken = testUser;
  });

  test("should create checkout session with valid token", async () => {
    const response = await request(app)
      .post("/billing/create-checkout-session")
      .set("Authorization", `Bearer ${authToken}`)
      .send({ priceId: "price_123" });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("sessionId");
  });

  test("should reject request without token", async () => {
    const response = await request(app)
      .post("/billing/create-checkout-session")
      .send({ priceId: "price_123" });

    expect(response.status).toBe(401);
  });
});
```

## Troubleshooting

### Common Issues

1. **Token Expired Error**

   - Solution: Implement automatic token refresh on the client
   - Call `user.getIdToken(true)` to force refresh

2. **CORS Errors**

   - Solution: Configure CORS properly on backend
   - Include credentials in fetch requests

3. **403 Forbidden**

   - Check custom claims are set correctly
   - Verify user has required permissions

4. **Token Verification Fails**
   - Ensure Firebase Admin SDK is initialized correctly
   - Check service account credentials
   - Verify project ID matches

### Debug Mode

```javascript
// Add debug logging in development
if (process.env.NODE_ENV === "development") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`, {
      headers: req.headers,
      user: req.user,
    });
    next();
  });
}
```

## References

- [Firebase Auth REST API](https://firebase.google.com/docs/auth/admin/verify-id-tokens)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
