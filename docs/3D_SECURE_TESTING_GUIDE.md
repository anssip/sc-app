# 3D Secure Testing Guide

This guide explains how to test the 3D Secure implementation for credit card payments.

## Test Cards

Use these Stripe test card numbers to simulate different 3D Secure scenarios:

### Cards that Always Require 3D Secure
- **4000 0027 6000 3184** - Always requires authentication
  - Use any CVC and future expiry date
  - Will show 3D Secure modal

### Cards that Require 3D Secure for Regulatory Reasons
- **4000 0025 0000 3155** - Requires authentication due to European regulations
  - Simulates Strong Customer Authentication (SCA) requirements

### Cards for Testing Different Outcomes
- **4000 0000 0000 3220** - 3D Secure authentication will succeed
- **4000 0082 6000 0000** - 3D Secure authentication will fail
- **4000 0000 0000 3063** - 3D Secure required, but customer declines authentication

### Regular Cards (3D Secure only if required by amount/risk)
- **4242 4242 4242 4242** - Standard test card
- **5555 5555 5554 4444** - Mastercard test card

## Testing Flow

1. **Navigate to Payment Page**
   - Go to `/pricing`
   - Select a plan
   - Click "Get Started" to go to payment page

2. **Enter Card Details**
   - Use one of the test cards above
   - Use any future expiry date (e.g., 12/34)
   - Use any 3-digit CVC (e.g., 123)
   - Use any 5-digit ZIP code (e.g., 12345)

3. **Submit Payment**
   - Click "Start Free Trial"
   - For 3D Secure cards, you'll see authentication modal

4. **Complete 3D Secure Authentication**
   - In test mode, click "Complete Authentication" in the modal
   - For failure testing cards, click "Fail Authentication"

5. **Verify Success**
   - Should redirect to `/thank-you` page on success
   - Should show error message on failure

## What to Look For

### Success Indicators
- ✅ 3D Secure modal appears for required cards
- ✅ Processing messages update during flow:
  - "Processing payment..."
  - "Authenticating payment..."
  - "Activating subscription..."
- ✅ Successful redirect to thank you page
- ✅ Subscription is active in Stripe Dashboard

### Error Handling
- ❌ Clear error messages for failed authentication
- ❌ Form remains accessible after errors
- ❌ Can retry with different card

## Backend Verification

After testing, verify in your backend logs:
1. Subscription created with `payment_behavior: 'default_incomplete'`
2. Setup Intent or Payment Intent created
3. Confirmation endpoint called after authentication
4. Subscription status updated to active/trialing

## Common Issues

### "Failed to create subscription"
- Check backend is returning correct response format
- Verify API endpoint is updated to new flow

### 3D Secure Modal Not Appearing
- Ensure using correct test card numbers
- Check browser console for JavaScript errors
- Verify Stripe.js is loaded correctly

### Authentication Succeeds but Subscription Fails
- Check confirmation endpoint implementation
- Verify subscription ID is being passed correctly
- Check backend logs for validation errors