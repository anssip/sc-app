import ReactGA from 'react-ga4'

const MEASUREMENT_ID = 'G-6RJTJKS2D7'

export const initGA = () => {
  ReactGA.initialize(MEASUREMENT_ID)
}

export const logPageView = (path: string) => {
  ReactGA.send({ hitType: 'pageview', page: path })
}

export const logEvent = (category: string, action: string, label?: string, value?: number) => {
  ReactGA.event({
    category,
    action,
    label,
    value,
  })
}

// Conversion Funnel Events
export const trackFunnelEvent = (step: string, details?: any) => {
  ReactGA.event({
    category: 'Conversion_Funnel',
    action: step,
    ...details
  })
}

export const FunnelSteps = {
  VIEW_PRICING: 'view_pricing',
  CLICK_START_TRIAL: 'click_start_trial',
  VIEW_PAYMENT_METHOD: 'view_payment_method',
  CLICK_PURCHASE: 'click_purchase',
  PURCHASE_COMPLETE: 'purchase_complete'
}

// Enhanced e-commerce events for better tracking
export const trackPricingView = (planName?: string, price?: number) => {
  trackFunnelEvent(FunnelSteps.VIEW_PRICING, {
    label: planName,
    value: price
  })
  
  // Also send GA4 recommended event
  ReactGA.event('view_item_list', {
    item_list_id: 'pricing_plans',
    item_list_name: 'Pricing Plans'
  })
}

export const trackStartTrialClick = (planName: string, price: number) => {
  trackFunnelEvent(FunnelSteps.CLICK_START_TRIAL, {
    label: planName,
    value: price
  })
  
  // GA4 recommended event
  ReactGA.event('begin_checkout', {
    currency: 'USD',
    value: price,
    items: [{
      item_name: planName,
      price: price,
      quantity: 1
    }]
  })
}

export const trackPaymentMethodView = (planName?: string, price?: number) => {
  trackFunnelEvent(FunnelSteps.VIEW_PAYMENT_METHOD, {
    label: planName,
    value: price
  })
  
  // GA4 recommended event
  ReactGA.event('add_payment_info', {
    currency: 'USD',
    value: price,
    payment_type: 'card'
  })
}

export const trackPurchaseClick = (planName: string, price: number) => {
  trackFunnelEvent(FunnelSteps.CLICK_PURCHASE, {
    label: planName,
    value: price
  })
}

export const trackPurchaseComplete = (planName: string, price: number, transactionId?: string) => {
  trackFunnelEvent(FunnelSteps.PURCHASE_COMPLETE, {
    label: planName,
    value: price
  })
  
  // GA4 recommended purchase event
  ReactGA.event('purchase', {
    transaction_id: transactionId || Date.now().toString(),
    value: price,
    currency: 'USD',
    items: [{
      item_name: planName,
      price: price,
      quantity: 1
    }]
  })
}