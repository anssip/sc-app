import { useState, FormEvent } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { useNavigate } from '@remix-run/react'
import Button from './Button'
import { getAuth } from 'firebase/auth'
import { trackPurchaseClick } from '~/lib/analytics'

interface SimplePaymentFormProps {
  priceId: string
  selectedPlan: string
  onSuccess?: () => void
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: '#ffffff',
      fontFamily: 'system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#6b7280',
      },
    },
    invalid: {
      color: '#ff5555',
      iconColor: '#ff5555',
    },
  },
}

export default function SimplePaymentForm({ priceId, selectedPlan, onSuccess }: SimplePaymentFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingMessage, setProcessingMessage] = useState<string>('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    // Track purchase button click
    const price = selectedPlan.toLowerCase() === 'starter' ? 9 : 29
    trackPurchaseClick(selectedPlan, price)

    setIsProcessing(true)
    setErrorMessage(null)
    setProcessingMessage('Processing payment...')

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Get the Firebase auth token
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        throw new Error('You must be logged in to subscribe')
      }

      const idToken = await user.getIdToken()

      // Step 1: Create subscription with our backend API
      // The backend will create a SetupIntent or PaymentIntent for 3D Secure
      const response = await fetch('https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          price_id: priceId,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
      }

      // Step 2: Confirm the payment with Stripe
      // This will handle 3D Secure authentication if required
      const { client_secret, type } = data

      setProcessingMessage('Authenticating payment...')

      let result
      if (type === 'setup_intent') {
        // For subscriptions with trial or $0 first payment
        result = await stripe.confirmCardSetup(client_secret, {
          payment_method: {
            card: cardElement,
          },
        })
      } else {
        // For immediate payment
        result = await stripe.confirmCardPayment(client_secret, {
          payment_method: {
            card: cardElement,
          },
        })
      }

      if (result.error) {
        // Show error to customer (e.g., insufficient funds, 3D Secure authentication failed)
        throw new Error(result.error.message || 'Payment confirmation failed')
      }

      // Step 3: Confirm subscription activation with backend
      setProcessingMessage('Activating subscription...')
      
      const confirmResponse = await fetch('https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          subscription_id: data.subscription_id,
          payment_intent_id: result.paymentIntent?.id,
          setup_intent_id: result.setupIntent?.id,
        }),
      })

      const confirmData = await confirmResponse.json()

      if (!confirmResponse.ok) {
        throw new Error(confirmData.error || 'Failed to confirm subscription')
      }

      // Success! Redirect to thank you page
      if (onSuccess) {
        onSuccess()
      } else {
        navigate('/thank-you')
      }
    } catch (error) {
      console.error('Payment error:', error)
      setErrorMessage(error instanceof Error ? error.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
      setProcessingMessage('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-black/40 rounded-lg p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Payment Details</h3>
        <p className="text-gray-400 text-sm mb-6">
          Start your 7-day free trial of the {selectedPlan} plan. You won't be charged until the trial ends.
        </p>
        
        <div className="bg-black rounded-lg p-4 border border-gray-700">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
      </div>

      {errorMessage && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
          <p className="text-red-400 text-sm">{errorMessage}</p>
        </div>
      )}

      <div className="flex gap-4">
        <Button
          type="button"
          onClick={() => navigate('/pricing')}
          variant="secondary"
          fullWidth
          disabled={isProcessing}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          fullWidth
          disabled={!stripe || isProcessing}
        >
          {isProcessing ? (processingMessage || 'Processing...') : 'Start Free Trial'}
        </Button>
      </div>

      <p className="text-gray-500 text-xs text-center">
        By confirming your subscription, you allow Spot Canvas to charge your payment method for this subscription and future renewals on a recurring basis.
      </p>
    </form>
  )
}