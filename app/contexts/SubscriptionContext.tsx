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
}

interface SubscriptionContextType extends SubscriptionData {
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined)

// Map price IDs to plan names using environment variables
const PRICE_TO_PLAN: Record<string, PlanType> = {
  [import.meta.env.VITE_STRIPE_PRICE_ID_STARTER]: 'starter',
  [import.meta.env.VITE_STRIPE_PRICE_ID_PRO]: 'pro',
}

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscriptionData, setSubscriptionData] = useState<SubscriptionData>({
    status: 'none',
    plan: 'none',
    isLoading: false, // Default to false for SSR
  })

  const refreshSubscription = async () => {
    try {
      const auth = getAuth()
      const user = auth.currentUser
      
      if (!user) {
        setSubscriptionData({
          status: 'none',
          plan: 'none',
          isLoading: false,
        })
        return
      }

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
      
      // Find the most relevant subscription (prioritize active/trialing, then any other)
      const activeSubscription = subscriptions.find(
        (sub: any) => sub.status === 'active' || sub.status === 'trialing'
      ) || subscriptions[0] // fallback to first subscription (including canceled)

      if (activeSubscription) {
        const plan = PRICE_TO_PLAN[activeSubscription.price_id] || 'none'
        
        setSubscriptionData({
          status: activeSubscription.status,
          plan,
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
        
        // If still no subscription found, set to none
        setSubscriptionData({
          status: 'none',
          plan: 'none',
          isLoading: false,
        })
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

    return unsubscribe
  }, [])

  return (
    <SubscriptionContext.Provider value={{ ...subscriptionData, refreshSubscription }}>
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