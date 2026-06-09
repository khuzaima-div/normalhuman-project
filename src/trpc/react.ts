"use client";

import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/api/root";

export const api = createTRPCReact<AppRouter>();

export const trpc = api.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});
