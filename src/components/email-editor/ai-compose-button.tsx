"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Loader2 } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

type AIComposeButtonProps = {
  isComposing?: boolean;
  onGenerate: (prompt: string) => Promise<void>;
};

function getAiErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error ?? "");
  if (message.includes("Limit reached")) {
    return "You have reached your free daily limit.";
  }
  return "Something went wrong. Please try again.";
}

export default function AIComposeButton({ onGenerate }: AIComposeButtonProps) {
  const [prompt, setPrompt] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    setIsLoading(true);
    try {
      await onGenerate(prompt);
      setPrompt("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to generate with AI:", error);
      toast.error(getAiErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 gap-1.5 px-2.5 text-caption font-medium shadow-token-xs"
        >
          <Bot className="size-3.5 text-primary" />
          <span>Ask AI</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 shadow-token-md" align="end" sideOffset={8}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <h4 className="flex items-center gap-1.5 text-caption font-semibold text-foreground">
              <Sparkles className="size-3 text-primary" />
              Compose with AI
            </h4>
            <p className="text-label text-muted-foreground">
              Tell the AI what you want to write or reply.
            </p>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a polite follow-up email about the project status..."
            className="min-h-20 resize-none text-caption"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 text-caption px-2.5"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-8 gap-1 px-2.5 text-caption"
              disabled={isLoading || !prompt.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-3 animate-spin" />
                  Generating...
                </>
              ) : (
                "Generate"
              )}
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
}
