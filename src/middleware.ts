import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Public routes define karein (Sign-in aur Webhook open rahenge)
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/api/clerk/webhook',
  "/api/initial-sync"
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // 1. Turbopack safe matcher: Saare normal pages aur routes par chalega
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    // 2. API, Webhooks aur Server Actions (POST requests) ko hamesha target karega
    '/(api|trpc)(.*)',
  ],
}