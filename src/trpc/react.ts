"use client";

import { createTRPCReact } from "@trpc/react-query";
import { httpLink } from "@trpc/client";
import superjson from "superjson";
import type { AppRouter } from "@/server/api/root";
import { inferRouterOutputs } from "@trpc/server";

export const api = createTRPCReact<AppRouter>();

export const trpc = api.createClient({
  links: [
    httpLink({
      url: "/api/trpc",
      transformer: superjson,
    }),
  ],
});

export type RouterOutputs = inferRouterOutputs<AppRouter>;
