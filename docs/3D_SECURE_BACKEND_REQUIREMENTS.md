# 3D Secure Backend Requirements

This document outlines the backend changes required to support 3D Secure authentication for credit card payments.

## Overview

The frontend has been updated to support 3D Secure authentication. The backend API needs to be modified to:

1. Create Setup Intents or Payment Intents instead of directly attaching payment methods
2. Handle the confirmation flow after 3D Secure authentication

## API Changes Required

### 1. POST `/api/subscriptions/signup`

**Current Implementation:**
- Accepts: `{ price_id, payment_method_id }`
- Creates subscription with attached payment method

**Required Changes:**
- Accept: `{ price_id }` (no payment_method_id)
- Create a subscription with `payment_behavior: 'default_incomplete'`
- Return the Setup Intent or Payment Intent client secret

**Response Format:**
```json
{
  "subscription_id": "sub_xxx",
  "client_secret": "seti_xxx_secret_xxx" or "pi_xxx_secret_xxx",
  "type": "setup_intent" or "payment_intent"
}
```

**Implementation Notes:**
- For subscriptions with trials or $0 first payment, Stripe will create a Setup Intent
- For subscriptions with immediate payment, Stripe will create a Payment Intent
- The `client_secret` comes from `subscription.pending_setup_intent` or `subscription.latest_invoice.payment_intent`

### 2. POST `/api/subscriptions/confirm` (New Endpoint)

**Purpose:** Confirm subscription activation after 3D Secure authentication

**Request:**
```json
{
  "subscription_id": "sub_xxx",
  "payment_intent_id": "pi_xxx" (optional),
  "setup_intent_id": "seti_xxx" (optional)
}
```

**Implementation:**
1. Verify the subscription exists and belongs to the authenticated user
2. Check if the Setup Intent or Payment Intent was successful
3. If successful, the subscription should already be active (Stripe handles this automatically)
4. Return success response

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "sub_xxx",
    "status": "active" or "trialing"
  }
}
```

## Stripe Configuration

Ensure your Stripe account has 3D Secure enabled:
1. In Stripe Dashboard, go to Settings → Payments → Payment methods
2. Enable "3D Secure" for card payments
3. Set rules for when to require 3D Secure (recommended: "Required when requested by card issuer")

## Testing 3D Secure

Use these test card numbers:
- `4000 0027 6000 3184` - Always requires 3D Secure authentication
- `4000 0025 0000 3155` - Requires 3D Secure for regulatory reasons
- `4242 4242 4242 4242` - Regular card (3D Secure only if required by amount/risk)

## Security Considerations

1. Always verify the subscription belongs to the authenticated user
2. Don't trust client-side payment status - always verify with Stripe
3. Use webhook handlers to update subscription status in your database
4. Handle edge cases where 3D Secure authentication times out or fails