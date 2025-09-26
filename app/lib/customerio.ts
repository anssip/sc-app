/**
 * Customer.io Integration Library
 * 
 * This library handles all interactions with Customer.io for:
 * - User tracking (browser-side via JavaScript SDK)
 * - Marketing consent management
 * - Event tracking
 * - Email campaign triggers
 * 
 * Required environment variables (.env file):
 * - VITE_CUSTOMER_IO_SITE_ID: Your site ID from Customer.io (required for browser tracking)
 * 
 * Optional environment variables:
 * - VITE_CUSTOMER_IO_TRACK_API_KEY: Track API key for server-side tracking (optional)
 * 
 * Note: 
 * - Environment variables must be prefixed with VITE_ to be exposed to the browser in Vite/Remix
 * - App API keys are NOT needed for web tracking - those are for mobile apps
 */

interface CustomerIOConfig {
  siteId?: string
  trackApiKey?: string  // For server-side Track API (optional)
}

interface UserData {
  email: string
  userId: string
  marketingConsent: boolean
  emailVerified: boolean
  createdAt?: number
  [key: string]: any
}

interface EventData {
  [key: string]: any
}

class CustomerIO {
  private config: CustomerIOConfig
  private isInitialized: boolean = false

  constructor() {
    // In Vite/Remix, use import.meta.env for client-side environment variables
    // These need to be prefixed with VITE_ to be exposed to the browser
    this.config = {
      siteId: typeof window !== 'undefined' 
        ? (import.meta.env?.VITE_CUSTOMER_IO_SITE_ID || '') 
        : '',
      trackApiKey: typeof window !== 'undefined'
        ? (import.meta.env?.VITE_CUSTOMER_IO_TRACK_API_KEY || '')
        : '', // Optional for server-side
    }
    
    // Only initialize if we have the required Site ID for browser tracking
    if (this.config.siteId) {
      this.isInitialized = true
    } else {
    }
  }

  /**
   * Identify a user in Customer.io
   */
  async identify(userData: UserData): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      // In a real implementation, this would make an API call to Customer.io
      // For now, we'll just create the user object
      const userPayload = {
        id: userData.userId,
        email: userData.email,
        created_at: userData.createdAt || Math.floor(Date.now() / 1000),
        email_verified: userData.emailVerified,
        marketing_consent: userData.marketingConsent,
      }

      // If using Customer.io JavaScript SDK in the browser:
      if (typeof window !== 'undefined' && (window as any)._cio) {
        (window as any)._cio.identify({
          id: userData.userId,
          email: userData.email,
          created_at: userData.createdAt || Math.floor(Date.now() / 1000),
          email_verified: userData.emailVerified,
          marketing_consent: userData.marketingConsent,
        })
      }
    } catch (error) {
    }
  }

  /**
   * Track an event in Customer.io
   */
  async track(eventName: string, eventData?: EventData): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {

      // If using Customer.io JavaScript SDK in the browser:
      if (typeof window !== 'undefined' && (window as any)._cio) {
        (window as any)._cio.track(eventName, eventData || {})
      }
    } catch (error) {
    }
  }

  /**
   * Update user's marketing consent
   */
  async updateMarketingConsent(userId: string, consent: boolean): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      
      // Track the consent change event
      await this.track('marketing_consent_updated', {
        user_id: userId,
        consent,
        timestamp: Date.now(),
      })

      // Update user attributes
      if (typeof window !== 'undefined' && (window as any)._cio) {
        (window as any)._cio.identify({
          id: userId,
          marketing_consent: consent,
          marketing_consent_updated_at: Math.floor(Date.now() / 1000),
        })
      }
    } catch (error) {
    }
  }

  /**
   * Track user signup event
   */
  async trackSignup(userData: UserData): Promise<void> {
    await this.identify(userData)
    await this.track('user_signed_up', {
      email: userData.email,
      marketing_consent: userData.marketingConsent,
      signup_method: 'email',
    })
  }

  /**
   * Track email verification event
   */
  async trackEmailVerified(userId: string, email: string): Promise<void> {
    await this.track('email_verified', {
      user_id: userId,
      email,
      verified_at: Date.now(),
    })

    // Update user attribute
    if (typeof window !== 'undefined' && (window as any)._cio) {
      (window as any)._cio.identify({
        id: userId,
        email_verified: true,
        email_verified_at: Math.floor(Date.now() / 1000),
      })
    }
  }

  /**
   * Track subscription started event
   */
  async trackSubscriptionStarted(userId: string, planDetails: any): Promise<void> {
    await this.track('subscription_started', {
      user_id: userId,
      ...planDetails,
      started_at: Date.now(),
    })
  }

  /**
   * Remove a user from Customer.io (for GDPR compliance)
   */
  async deleteUser(userId: string): Promise<void> {
    if (!this.isInitialized) {
      return
    }

    try {
      
      // In a real implementation, this would make an API call to Customer.io
      // to delete the user's data
      
      // Track deletion event before removing
      await this.track('user_deleted', {
        user_id: userId,
        deleted_at: Date.now(),
      })
    } catch (error) {
    }
  }
}

// Export singleton instance
export const customerIO = new CustomerIO()

// Helper function to initialize Customer.io tracking script
export const initializeCustomerIOScript = (siteId: string): void => {
  if (typeof window === 'undefined') return
  
  // Check if already initialized
  if ((window as any)._cio) return

  // Add Customer.io tracking script
  const script = document.createElement('script')
  script.type = 'text/javascript'
  script.async = true
  script.src = 'https://assets-eu.customer.io/assets/track-eu.js'
  
  // Initialize Customer.io
  (window as any)._cio = (window as any)._cio || [];
  (window as any)._cio.push(['initialize', {
    siteId,
  }])
  
  document.head.appendChild(script)
}