/**
 * YOU PROBABLY DON'T NEED TO EDIT THIS FILE, UNLESS:
 * 1. You want to modify request context (see Part 1).
 * 2. You want to create a new middleware or type of procedure (see Part 3).
 *
 * TL;DR - This is where all the tRPC server stuff is created and plugged in. The pieces you will
 * need to use are documented accordingly near the end.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";
import { auth } from "@clerk/nextjs/server"; // Clerk server auth layer integration

import { db } from "@/server/db";

/**
 * 1. CONTEXT
 *
 * This section defines the "contexts" that are available in the backend API.
 */
export const createTRPCContext = async (opts: { headers: Headers }) => {
  // Clerk se authenticated user metadata session fetch karna
  const session = await auth();

  return {
    db,
    auth: session, // This injects ctx.auth.userId safely into your procedures
    ...opts,
  };
};

// Explicit type export to crush ts(7031) 'any' errors automatically in router files
export type TRPCContext = Awaited<ReturnType<typeof createTRPCContext>>;

/**
 * 2. INITIALIZATION
 */
const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * Create a server-side caller.
 */
export const createCallerFactory = t.createCallerFactory;

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 */
export const createTRPCRouter = t.router;

/**
 * Middleware for timing procedure execution
 */
const timingMiddleware = t.middleware(async ({ next, path }) => {
  const start = Date.now();

  const result = await next();
  const end = Date.now();
  if (process.env.NODE_ENV === "development") {
    console.debug(`[TRPC] ${path} took ${end - start}ms`);
  }

  return result;
});

/**
 * Public (unauthenticated) procedure
 */
export const publicProcedure = t.procedure.use(timingMiddleware);

/**
 * 🌟 4. ELLIOTT'S PRIVATE/PROTECTED AUTH PROCEDURE
 * This custom middleware blocks unauthenticated requests and provides type-safe ctx.auth
 */
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.auth?.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be logged in to access this resource.",
    });
  }
  return next({
    ctx: {
      // Infers that auth is guaranteed to be present downstream
      auth: {
        userId: ctx.auth.userId,
      },
    },
  });
});

// Exporting privateProcedure to fulfill target router call requirements
export const privateProcedure = t.procedure.use(timingMiddleware).use(isAuthed);