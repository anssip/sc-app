# HTTP Cache Headers Implementation for Firebase Hosting

## Overview
Implemented HTTP cache headers to ensure SSR pages are cached and automatically re-rendered after specified timeouts. This provides better performance while ensuring users see updated content after cache expiration.

## Implementation Details

### 1. Cache Utility Module (`app/lib/cache.server.ts`)
Created a centralized cache configuration module with:
- Predefined cache profiles for different content types
- Helper functions to generate cache headers
- Support for browser cache, CDN cache, and stale-while-revalidate

### 2. Cache Profiles

| Profile | Browser Cache | CDN Cache | Stale-While-Revalidate | Use Case |
|---------|--------------|-----------|------------------------|----------|
| HOMEPAGE | 2 minutes | 5 minutes | 30 minutes | Homepage balance between freshness and performance |
| BLOG_POST | 5 minutes | 10 minutes | 1 hour | Individual blog posts |
| BLOG_INDEX | 1 minute | 5 minutes | 10 minutes | Blog listing page |
| PRICING | 10 minutes | 30 minutes | 1 hour | Pricing page that changes occasionally |
| STATIC | 1 hour | 1 hour | 24 hours | Static content that rarely changes |
| PRIVATE | No cache | No cache | - | User-specific content |

### 3. Updated Routes
- **Blog Posts** (`app/routes/blog.$slug.tsx`): 5-minute browser cache with 1-hour stale-while-revalidate
- **Blog Index** (`app/routes/blog._index.tsx`): 1-minute browser cache for fresh listings
- **Homepage** (`app/routes/_index.tsx`): 2-minute browser cache for balance
- **Pricing** (`app/routes/pricing.tsx`): 10-minute browser cache for semi-static content

## How It Works with Firebase Hosting

Firebase Hosting respects standard HTTP cache headers:

1. **Browser Caching** (`max-age`): Controls how long browsers cache the response
2. **CDN Caching** (`s-maxage`): Controls Firebase's edge server caching
3. **Stale-While-Revalidate**: Serves cached content while fetching fresh data in background

## Cache Behavior

When a user visits a cached page:
1. **First visit**: Page is rendered server-side and cached
2. **Within cache time**: Cached version is served immediately
3. **After cache expires**: 
   - With `stale-while-revalidate`: Old content shown while fetching new
   - Without: Fresh content fetched before serving

## Benefits

1. **Improved Performance**: Reduced server load and faster page loads
2. **Automatic Updates**: Content refreshes automatically after cache timeout
3. **Better UX**: Stale-while-revalidate ensures users always see content quickly
4. **SEO Friendly**: Search engines get fast responses
5. **Cost Effective**: Reduced Firebase function invocations

## Testing Cache Headers

To verify cache headers are working:

```bash
# Check response headers
curl -I https://spotcanvas.com/blog/some-post

# Look for Cache-Control header
Cache-Control: public, max-age=300, s-maxage=600, stale-while-revalidate=3600
```

## Adjusting Cache Times

To modify cache durations, edit the profiles in `app/lib/cache.server.ts`:

```typescript
BLOG_POST: {
  public: true,
  maxAge: 300,  // Change browser cache time (seconds)
  sMaxAge: 600, // Change CDN cache time (seconds)
  staleWhileRevalidate: 3600, // Change stale time (seconds)
}
```

## Notes

- User-specific pages (billing, chart, etc.) remain uncached for security
- Cache headers work with Firebase Hosting's CDN automatically
- Changes to content will be visible to users after cache expiration
- For immediate updates, you can implement cache purging via Firebase Hosting API