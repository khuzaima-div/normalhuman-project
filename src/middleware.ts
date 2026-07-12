import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/api/clerk/webhook',
  // Public for Aurinko provider callbacks; authenticity verified via HMAC in the route handler.
  '/api/aurinko/webhook',
  '/api/webhooks/stripe',
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.[^?]*$).*)',
    '/(api|trpc)(.*)',
  ],
}
