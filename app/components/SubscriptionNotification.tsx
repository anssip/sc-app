import { useEffect, useState } from 'react'
import { Link } from '@remix-run/react'
import { X, AlertCircle, Clock } from 'lucide-react'
import { useSubscription } from '~/contexts/SubscriptionContext'
import Button from './Button'

export default function SubscriptionNotification() {
  const { status, plan, trialEndsAt } = useSubscription()
  const [isDismissed, setIsDismissed] = useState(false)
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null)

  useEffect(() => {
    if (status === 'trialing' && trialEndsAt) {
      const now = new Date()
      const trial = new Date(trialEndsAt)
      const diffTime = trial.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      setDaysRemaining(diffDays)
    }
  }, [status, trialEndsAt])

  // Don't show if user has an active subscription or has dismissed
  if (status === 'active' || isDismissed) {
    return null
  }

  // Show trial ending warning
  if (status === 'trialing' && daysRemaining !== null && daysRemaining <= 3) {
    return (
      <div className="relative bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 text-yellow-500/50 hover:text-yellow-500"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <Clock className="h-5 w-5 text-yellow-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-yellow-500 font-medium mb-1">
              Your Pro trial ends in {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Choose your plan to continue using Spot Canvas after your trial ends.
            </p>
            <Button asLink to="/pricing" variant="primary" size="sm">
              Choose Plan
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show no subscription warning
  if (status === 'none') {
    return (
      <div className="relative bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-4">
        <button
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 text-red-500/50 hover:text-red-500"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-red-500 font-medium mb-1">
              No Active Subscription
            </h3>
            <p className="text-gray-400 text-sm mb-3">
              Start your 7-day free trial to access all features of Spot Canvas.
            </p>
            <Button asLink to="/pricing" variant="primary" size="sm">
              Start Free Trial
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return null
}