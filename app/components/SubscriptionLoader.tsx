import { useEffect, useState } from 'react'
import { useSubscription } from '~/contexts/SubscriptionContext'

interface SubscriptionLoaderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function SubscriptionLoader({ children, fallback }: SubscriptionLoaderProps) {
  const { isLoading, refreshSubscription } = useSubscription()
  const [hasInitialized, setHasInitialized] = useState(false)

  useEffect(() => {
    // Force a fresh subscription check when component mounts
    refreshSubscription().finally(() => {
      setHasInitialized(true)
    })
  }, [])

  // Show loading state while subscription is being fetched
  if (!hasInitialized || isLoading) {
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