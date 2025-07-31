import { useState, FormEvent } from 'react'
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js'
import { useNavigate } from '@remix-run/react'
import Button from './Button'
import { getAuth } from 'firebase/auth'

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setErrorMessage(null)

    try {
      // Get the card element
      const cardElement = elements.getElement(CardElement)
      if (!cardElement) {
        throw new Error('Card element not found')
      }

      // Create payment method
      const { error: pmError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      })

      if (pmError) {
        throw new Error(pmError.message || 'Failed to process payment method')
      }

      if (!paymentMethod) {
        throw new Error('Failed to create payment method')
      }

      // Get the Firebase auth token
      const auth = getAuth()
      const user = auth.currentUser
      if (!user) {
        throw new Error('You must be logged in to subscribe')
      }

      const idToken = await user.getIdToken()

      // Create subscription with our backend API
      const response = await fetch('https://billing-server-346028322665.europe-west1.run.app/api/subscriptions/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          price_id: priceId,
          payment_method_id: paymentMethod.id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create subscription')
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
          {isProcessing ? 'Processing...' : 'Start Free Trial'}
        </Button>
      </div>

      <p className="text-gray-500 text-xs text-center">
        By confirming your subscription, you allow Spot Canvas to charge your payment method for this subscription and future renewals on a recurring basis.
      </p>
    </form>
  )
}