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

type AIComposeButtonProps = {
  isComposing?: boolean;
  onGenerate: (prompt: string) => Promise<void>;
};

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
          className="h-8 gap-1.5 border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 shadow-none hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Bot className="size-3.5 text-emerald-500" />
          <span>Ask AI</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-3" align="end" sideOffset={8}>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-1">
            <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1">
              <Sparkles className="size-3 text-emerald-500" />
              Compose with AI
            </h4>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Tell the AI what you want to write or reply.
            </p>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g., Write a polite follow-up email about the project status..."
            className="min-h-20 resize-none text-xs focus-visible:ring-emerald-500"
            disabled={isLoading}
          />
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs px-2.5"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-7 text-xs bg-zinc-950 text-zinc-50 hover:bg-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200 px-2.5 gap-1"
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