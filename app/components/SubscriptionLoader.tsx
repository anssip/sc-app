import { useEffect, useState } from 'react'
import { useSubscription } from '~/contexts/SubscriptionContext'
import { useAuth } from '~/lib/auth-context'

interface SubscriptionLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function SubscriptionLoader({ children, fallback }: SubscriptionLoaderProps) {
  const { isLoading: subscriptionLoading, refreshSubscription } = useSubscription()
  const { loading: authLoading } = useAuth()
  const [hasInitialized, setHasInitialized] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(true)

  useEffect(() => {
    // Only refresh subscription when auth is ready
    if (!authLoading) {
      setIsRefreshing(true)
      refreshSubscription().finally(() => {
        setHasInitialized(true)
        setIsRefreshing(false)
      })
    }
  }, [authLoading])

  // Show loading state while auth is loading, subscription is being fetched, or still refreshing
  if (authLoading || !hasInitialized || subscriptionLoading || isRefreshing) {
    return (
      fallback || (
        <div className="min-h-screen flex items-center justify-center bg-primary-dark">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Loading...</span>
          </div>
        </div>
      )
    )
  }

  return <>{children}</>
}