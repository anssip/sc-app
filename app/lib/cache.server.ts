/**
 * Cache control utilities for HTTP caching with Firebase Hosting
 * Firebase Hosting respects standard HTTP cache headers
 */

export interface CacheOptions {
  /**
   * Max age in seconds for browser cache
   */
  maxAge?: number
  /**
   * Max age in seconds for CDN/shared cache (s-maxage)
   */
  sMaxAge?: number
  /**
   * Stale-while-revalidate time in seconds
   * Allows serving stale content while fetching fresh content in background
   */
  staleWhileRevalidate?: number
  /**
   * Whether the response can be cached publicly (CDN) or only privately (browser)
   */
  public?: boolean
  /**
   * Disable caching entirely
   */
  noCache?: boolean
}

/**
 * Predefined cache configurations for different content types
 */
export const CacheProfiles = {
  // Static content that rarely changes - cache for 1 hour
  STATIC: {
    public: true,
    maxAge: 3600, // 1 hour browser cache
    sMaxAge: 3600, // 1 hour CDN cache
    staleWhileRevalidate: 86400, // 24 hours stale-while-revalidate
  },

  // Blog posts - cache for 5 minutes, allow stale content while revalidating
  BLOG_POST: {
    public: true,
    maxAge: 300, // 5 minutes browser cache
    sMaxAge: 600, // 10 minutes CDN cache
    staleWhileRevalidate: 3600, // 1 hour stale-while-revalidate
  },

  // Blog index - shorter cache for list pages
  BLOG_INDEX: {
    public: true,
    maxAge: 60, // 1 minute browser cache
    sMaxAge: 300, // 5 minutes CDN cache
    staleWhileRevalidate: 600, // 10 minutes stale-while-revalidate
  },

  // Homepage - balance between freshness and performance
  HOMEPAGE: {
    public: true,
    maxAge: 120, // 2 minutes browser cache
    sMaxAge: 300, // 5 minutes CDN cache
    staleWhileRevalidate: 1800, // 30 minutes stale-while-revalidate
  },

  // Pricing page - cache moderately as it may change occasionally
  PRICING: {
    public: true,
    maxAge: 600, // 10 minutes browser cache
    sMaxAge: 1800, // 30 minutes CDN cache
    staleWhileRevalidate: 3600, // 1 hour stale-while-revalidate
  },

  // User-specific content - no public caching
  PRIVATE: {
    public: false,
    maxAge: 0,
    noCache: true,
  },

  // No caching at all
  NO_CACHE: {
    noCache: true,
  },
} as const

/**
 * Generate Cache-Control header value from options
 */
export function getCacheControlHeader(options: CacheOptions): string {
  if (options.noCache) {
    return 'no-cache, no-store, must-revalidate'
  }

  const directives: string[] = []

  // Public vs private
  directives.push(options.public ? 'public' : 'private')

  // Max age for browser cache
  if (options.maxAge !== undefined) {
    directives.push(`max-age=${options.maxAge}`)
  }

  // Max age for CDN/shared cache
  if (options.sMaxAge !== undefined) {
    directives.push(`s-maxage=${options.sMaxAge}`)
  }

  // Stale-while-revalidate
  if (options.staleWhileRevalidate !== undefined) {
    directives.push(`stale-while-revalidate=${options.staleWhileRevalidate}`)
  }

  return directives.join(', ')
}

/**
 * Create headers object with cache control
 */
export function getCacheHeaders(options: CacheOptions): HeadersInit {
  return {
    'Cache-Control': getCacheControlHeader(options),
  }
}

/**
 * Helper to add cache headers to a json response
 */
export function jsonWithCache<T>(data: T, cacheOptions: CacheOptions, init?: ResponseInit) {
  const headers = new Headers(init?.headers)
  const cacheHeader = getCacheControlHeader(cacheOptions)
  headers.set('Cache-Control', cacheHeader)

  return new Response(JSON.stringify(data), {
    ...init,
    headers,
    status: init?.status || 200,
  })
}