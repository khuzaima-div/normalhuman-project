import { auth } from "@clerk/nextjs/server";
import { runInitialSync } from "@/lib/run-initial-sync";
import { db } from "@/server/db";
import { type NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

export const POST = async (req: NextRequest) => {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ error: "INVALID_REQUEST" }, { status: 400 });
    }

    const dbAccount = await db.account.findUnique({
      where: {
        id: accountId,
        userId,
      },
    });

    if (!dbAccount) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await runInitialSync(accountId);

    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error("Error in initial-sync route:", error);
    const message = error instanceof Error ? error.message : "INTERNAL_SERVER_ERROR";
    return NextResponse.json({ error: message }, { status: 500 });
  }
};
