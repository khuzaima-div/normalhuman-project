import { auth } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { getAurinkoCallbackUrl } from "@/lib/aurinko"

/**
 * Starts Aurinko account linking.
 * IMAP still needs Aurinko unified scopes so the app permissions are known.
 */
export async function GET(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 })
  }

  const serviceType = (req.nextUrl.searchParams.get("serviceType") ?? "IMAP").trim()
  const clientId = process.env.AURINKO_CLIENT_ID
  const returnUrl = getAurinkoCallbackUrl()

  if (!clientId) {
    return NextResponse.json({ message: "AURINKO_CLIENT_ID is not configured" }, { status: 500 })
  }

  const params = new URLSearchParams({
    clientId,
    serviceType,
    responseType: "code",
    returnUrl,
    state: userId,
  })

  if (serviceType === "IMAP") {
    params.set("scopes", "Mail.Read")
  } else if (serviceType === "Google" || serviceType === "Office365") {
    params.set("scopes", "Mail.Read Mail.ReadWrite Mail.Send Mail.Drafts Mail.All")
  }

  const authorizeUrl = `https://api.aurinko.io/v1/auth/authorize?${params.toString()}`
  return NextResponse.redirect(authorizeUrl)
}
