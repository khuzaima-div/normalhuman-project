import { SignIn } from "@clerk/nextjs"
import { BrandMark } from "@/components/brand-mark"

export default function Page() {
  return (
    <div className="flex min-h-screen bg-background">
      <div className="brand-mesh hidden w-1/2 flex-col justify-between border-r border-border p-12 lg:flex">
        <BrandMark size="sm" />

        <div className="max-w-md space-y-5">
          <h1 className="text-display font-semibold tracking-tight text-foreground">
            Email, reimagined.
          </h1>
          <p className="text-body leading-relaxed text-muted-foreground">
            A calm inbox with AI that understands your messages — not just keywords.
          </p>
        </div>

        <p className="text-caption text-muted-foreground">
          Secure sign-in powered by Clerk
        </p>
      </div>

      <div className="flex flex-1 flex-col">
        <div className="border-b border-border px-6 py-4 lg:hidden">
          <BrandMark size="sm" />
        </div>

        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: "oklch(0.52 0.14 252)",
                colorForeground: "oklch(0.21 0.012 260)",
                colorMutedForeground: "oklch(0.52 0.012 260)",
                colorBackground: "transparent",
                colorInput: "oklch(0.995 0.002 250)",
                colorInputForeground: "oklch(0.21 0.012 260)",
                borderRadius: "0.625rem",
                fontFamily: "var(--font-figtree-sans), ui-sans-serif, system-ui, sans-serif",
              },
              elements: {
                rootBox: "w-full max-w-sm mx-auto",
                card: "shadow-none border border-border bg-card rounded-2xl p-1",
                headerTitle: "text-title font-semibold tracking-tight",
                headerSubtitle: "text-caption text-muted-foreground",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg shadow-token-xs transition-colors duration-200",
                formFieldInput:
                  "rounded-lg border-border bg-background shadow-token-xs focus:ring-2 focus:ring-ring/40",
                footerActionLink: "text-primary hover:text-primary/80",
                identityPreviewEditButton: "text-primary",
                formFieldLabel: "text-label font-medium text-muted-foreground",
                dividerLine: "bg-border",
                dividerText: "text-muted-foreground text-caption",
                socialButtonsBlockButton:
                  "border-border bg-background hover:bg-muted rounded-lg transition-colors duration-200",
              },
            }}
          />
        </div>
      </div>
    </div>
  )
}
