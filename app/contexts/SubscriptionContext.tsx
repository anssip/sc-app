import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getAuth } from 'firebase/auth'
import { getFirestore, collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore'

export type SubscriptionStatus = 'none' | 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired'
export type PlanType = 'starter' | 'pro' | 'none'

interface SubscriptionData {
  status: SubscriptionStatus
  plan: PlanType
  trialEndsAt?: Date
  currentPeriodEnd?: Date
  subscriptionId?: string
  customerId?: string
  isLoading: boolean
  previewStartTime?: number
  isPreviewExpired?: boolean
}

interface SubscriptionContextType extends SubscriptionData {
  refreshSubscription: () => Promise<void>
  canAddMoreLayouts: (currentCount: number) => boolean
  canAddMoreIndicators: (currentCount: number) => boolean
  getLayoutLimit: () => number | null
  getIndicatorLimit: () => number | null
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Map price IDs to plan names using environment variables
const PRICE_TO_PLAN: Record<string, PlanType> = {
  [import.meta.env.VITE_STRIPE_PRICE_ID_STARTER]: 'starter',
  [import.meta.env.VITE_STRIPE_PRICE_ID_PRO]: 'pro',
}

const PREVIEW_DURATION_MINUTES = 5

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    status: 'none',
    plan: 'none',
    isLoading: true, // Start with loading true to wait for auth check
  })
  const [previewTimer, setPreviewTimer] = useState<NodeJS.Timeout | null>(null)

  const refreshSubscription = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      
      if (!user) {
        console.log('No authenticated user found')
        setSubscriptionData({
          status: 'none',
          plan: 'none',
          isLoading: false,
        })
        return
      }
      
      console.log('Fetching subscription for user:', user.uid)

      const idToken = await user.getIdToken()
      
      // Fetch user's subscriptions
      const response = await fetch('https://billing-server-346028322665.europe-west1.run.app/api/subscriptions', {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch subscriptions')
      }

      const data = await response.json()
      const subscriptions = data.subscriptions || []
      
      console.log('Subscriptions from API:', subscriptions)
      console.log('Price to plan mapping:', PRICE_TO_PLAN)
      console.log('Environment variables:', {
        starter: import.meta.env.VITE_STRIPE_PRICE_ID_STARTER,
        pro: import.meta.env.VITE_STRIPE_PRICE_ID_PRO
      })
      
      // Find the most relevant subscription (prioritize active/trialing, then any other)
      const activeSubscription = subscriptions.find(
        (sub: any) => sub.status === 'active' || sub.status === 'trialing'
      ) || subscriptions[0] // fallback to first subscription (including canceled)

      if (activeSubscription) {
        const plan = PRICE_TO_PLAN[activeSubscription.price_id] || 'none'
        
        // If we have a subscription but plan mapping failed, try to infer from price
        let finalPlan = plan
        if (plan === 'none' && activeSubscription.price_id) {
          // Check if price_id contains hints about the plan
          if (activeSubscription.price_id.toLowerCase().includes('starter') || 
              activeSubscription.price_id.toLowerCase().includes('basic')) {
            finalPlan = 'starter'
            console.log('Inferred starter plan from price_id')
          } else if (activeSubscription.price_id.toLowerCase().includes('pro') || 
                     activeSubscription.price_id.toLowerCase().includes('premium')) {
            finalPlan = 'pro'
            console.log('Inferred pro plan from price_id')
          } else {
            // Default to starter if we have ANY active subscription but can't determine the plan
            // This ensures users with active subscriptions at least get starter limits
            console.warn('Could not determine plan from price_id, defaulting to starter:', activeSubscription.price_id)
            finalPlan = 'starter'
          }
        }
        
        console.log('Setting subscription data:', {
          status: activeSubscription.status,
          plan: finalPlan,
          price_id: activeSubscription.price_id,
          mapped_plan: plan
        })
        
        setSubscriptionData({
          status: activeSubscription.status,
          plan: finalPlan,
          subscriptionId: activeSubscription.subscription_id,
          trialEndsAt: activeSubscription.trial_end ? new Date(activeSubscription.trial_end * 1000) : undefined,
          isLoading: false,
        })
      } else {
        // If no subscription from API, check Firestore directly for canceled subscriptions
        
        const db = getFirestore()
        const subscriptionsRef = collection(db, 'subscriptions')
        const q = query(
          subscriptionsRef,
          where('firebase_uid', '==', user.uid),
          orderBy('created_at', 'desc'),
          limit(1)
        )
        
        try {
          const querySnapshot = await getDocs(q)
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]
            const subData = doc.data()
            if (subData.status === 'canceled') {
              const plan = PRICE_TO_PLAN[subData.price_id] || 'none'
              
              setSubscriptionData({
                status: 'canceled',
                plan,
                subscriptionId: subData.subscription_id,
                trialEndsAt: subData.trial_end ? new Date(subData.trial_end * 1000) : undefined,
                isLoading: false,
              })
              return
            }
          }
        } catch (firestoreError) {
          console.error('Error querying Firestore:', firestoreError)
        }
        
        // If still no subscription found, set to none and start preview timer for new users
        const previewKey = `preview_start_${user.uid}`
        let previewStart = localStorage.getItem(previewKey)
        
        if (!previewStart) {
          // First time user - start the preview timer
          previewStart = Date.now().toString()
          localStorage.setItem(previewKey, previewStart)
        }
        
        const startTime = parseInt(previewStart)
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60)
        const isExpired = elapsedMinutes >= PREVIEW_DURATION_MINUTES
        
        setSubscriptionData({
          status: 'none',
          plan: 'none',
          isLoading: false,
          previewStartTime: startTime,
          isPreviewExpired: isExpired,
        })
        
        // Set a timer to update when preview expires
        if (!isExpired) {
          const remainingMs = (PREVIEW_DURATION_MINUTES * 60 * 1000) - (Date.now() - startTime)
          if (previewTimer) clearTimeout(previewTimer)
          const timer = setTimeout(() => {
            setSubscriptionData(prev => ({ ...prev, isPreviewExpired: true }))
          }, remainingMs)
          setPreviewTimer(timer)
        }
      }
    } catch (error) {
      console.error('Failed to fetch subscription data:', error)
      setSubscriptionData((prev) => ({ ...prev, isLoading: false }))
    }
  }

  useEffect(() => {
    refreshSubscription()
    
    // Listen for auth state changes
    const auth = getAuth()
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        refreshSubscription()
      } else {
        setSubscriptionData({
          status: 'none',
          plan: 'none',
          isLoading: false,
        })
      }
    })

    return () => {
      unsubscribe()
      if (previewTimer) clearTimeout(previewTimer)
    }
  }, [])

  // Helper functions for checking plan limitations
  const canAddMoreLayouts = (currentCount: number): boolean => {
    // During trial, both plans have unlimited access
    if (subscriptionData.status === 'trialing') {
      return true
    }
    
    // Active, past_due, incomplete subscription with Starter plan has limit of 2 layouts
    // Include incomplete to handle payment processing states
    const hasStarterAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'starter'
    if (hasStarterAccess) {
      return currentCount < 2
    }
    
    // Pro plan has unlimited layouts
    const hasProAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'pro'
    if (hasProAccess) {
      return true
    }
    
    // No subscription, canceled, or expired - should prompt to subscribe
    return false
  }

  const canAddMoreIndicators = (currentCount: number): boolean => {
    // During trial, both plans have unlimited access
    if (subscriptionData.status === 'trialing') {
      return true
    }
    
    // Active, past_due, incomplete subscription with Starter plan has limit of 2 indicators per chart
    const hasStarterAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'starter'
    if (hasStarterAccess) {
      return currentCount < 2
    }
    
    // Pro plan has unlimited indicators
    const hasProAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'pro'
    if (hasProAccess) {
      return true
    }
    
    // No subscription, canceled, or expired - should prompt to subscribe
    return false
  }

  const getLayoutLimit = (): number | null => {
    console.log('getLayoutLimit called with:', {
      status: subscriptionData.status,
      plan: subscriptionData.plan,
      isLoading: subscriptionData.isLoading
    })
    
    if (subscriptionData.status === 'trialing') {
      return null // unlimited during trial
    }
    
    const hasStarterAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'starter'
    if (hasStarterAccess) {
      console.log('Returning limit 2 for Starter plan')
      return 2
    }
    
    const hasProAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'pro'
    if (hasProAccess) {
      return null // unlimited for pro
    }
    
    console.log('No subscription detected, returning 0')
    return 0 // no subscription
  }

  const getIndicatorLimit = (): number | null => {
    if (subscriptionData.status === 'trialing') {
      return null // unlimited during trial
    }
    
    const hasStarterAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'starter'
    if (hasStarterAccess) {
      return 2
    }
    
    const hasProAccess = ['active', 'past_due', 'incomplete'].includes(subscriptionData.status) && subscriptionData.plan === 'pro'
    if (hasProAccess) {
      return null // unlimited for pro
    }
    
    return 0 // no subscription
  }

  return (
    <SubscriptionContext.Provider value={{ 
      ...subscriptionData, 
      refreshSubscription,
      canAddMoreLayouts,
      canAddMoreIndicators,
      getLayoutLimit,
      getIndicatorLimit
    }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscription() {
  const context = useContext(SubscriptionContext)
  if (context === undefined) {
    throw new Error('useSubscription must be used within a SubscriptionProvider')
  }
  return context
}