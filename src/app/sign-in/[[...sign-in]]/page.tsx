import { SignIn } from '@clerk/nextjs'
import { Mail } from 'lucide-react'

export default function Page() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="hidden w-1/2 flex-col justify-between border-r border-border/60 bg-muted/30 p-12 lg:flex">
        <div className="flex items-center gap-2 text-foreground">
          <Mail className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold">Normal Human</span>
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
            Email, reimagined.
          </h1>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            A calm inbox with AI that understands your messages — not just keywords.
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Secure sign-in powered by Clerk
        </p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <SignIn />
      </div>
    </div>
  )
}
