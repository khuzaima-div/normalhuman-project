import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'

// Hum explicitely batayenge ke '/' public NAHI hai
const isPublicRoute = createRouteMatcher([
  '/sign-in(.*)',
  '/api/clerk/webhook'
])

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect()
  }
})

export const config = {
  matcher: [
    // Next.js ke internal files ke ilawa sab par middleware chalna chahiye
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}