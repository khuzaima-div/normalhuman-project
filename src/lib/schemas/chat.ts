import { z } from "zod";

export const chatMessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]).optional(),
  content: z.string().min(1).max(8_000),
});

export const chatRequestSchema = z.object({
  accountId: z.string().min(1).max(128),
  messages: z.array(chatMessageSchema).min(1).max(50),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;
