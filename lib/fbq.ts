declare global {
  interface Window {
    fbq?: (...args: any[]) => void
  }
}

function trackFbEvent(event: string, params?: Record<string, any>) {
  if (typeof window === "undefined") return
  if (!window.fbq) return

  if (params) {
    window.fbq("track", event, params)
  } else {
    window.fbq("track", event)
  }
}

export function trackInitiateCheckout(params?: Record<string, any>) {
  trackFbEvent("InitiateCheckout", params)
}

export function trackPurchase(params?: Record<string, any>) {
  trackFbEvent("Purchase", params)
}

export {}

