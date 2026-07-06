'use client'
import { useChat } from 'ai/react'
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button'
import React, { useEffect, useRef } from 'react'
import { Send, Sparkles } from 'lucide-react';
import { useLocalStorage } from 'usehooks-ts';
import { cn } from '@/lib/utils';
import PremiumBanner from './premium-banner';
import { toast } from 'sonner';

const transitionDebug = {
    type: "spring",
    stiffness: 200,
    damping: 25,
} as const;

const AskAI = ({ isCollapsed }: { isCollapsed: boolean }) => {
    const [accountId] = useLocalStorage('accountId', '')
    const containerRef = useRef<HTMLDivElement>(null)

    const { input, handleInputChange, handleSubmit, messages, isLoading } = useChat({
        api: "/api/chat",
        body: { accountId },
        onError: (error) => {
            if (error.message.includes('Limit reached')) {
                toast.error('You have reached your free daily limit. Please upgrade to Pro.')
            } else {
                toast.error('Something went wrong. Please try again.')
            }
        },
    });

    // Auto scroll to bottom when new words stream in
    useEffect(() => {
        if (containerRef.current) {
            containerRef.current.scrollTo({
                top: containerRef.current.scrollHeight,
                behavior: "smooth",
            });
        }
    }, [messages]);

    if (isCollapsed) return null;

    return (
        <div className='w-full'>
            <PremiumBanner /> 
            <div className="h-3"></div>
            
            <div className="flex flex-col border rounded-xl bg-gray-50 p-3 shadow-sm dark:bg-gray-900 h-112.5">

                {/* Chat Messages Body */}
                <div 
                    ref={containerRef}
                    className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 scrollbar-none"
                >
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-4">
                            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-full mb-3">
                                <Sparkles className="size-6 text-blue-500" />
                            </div>
                            <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Ask AI about your emails</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-50">
                                Get instant summaries, search flight details or meeting times.
                            </p>
                            
                            {/* Quick Suggestion Chips */}
                            <div className="flex flex-wrap gap-2 justify-center mt-4">
                                {['What can I ask?', 'Any urgent meetings?', 'Track my latest orders'].map((suggestion) => (
                                    <button
                                        key={suggestion}
                                        onClick={() => handleInputChange({ target: { value: suggestion } } as any)}
                                        className="px-2.5 py-1 text-xs bg-white dark:bg-gray-800 border hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg transition"
                                    >
                                        {suggestion}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <AnimatePresence initial={false}>
                            {messages.map((message) => (
                                <motion.div
                                    key={message.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={transitionDebug}
                                    className={cn(
                                        "flex flex-col max-w-[85%] rounded-2xl px-3.5 py-2 text-sm shadow-sm",
                                        message.role === 'user'
                                            ? "self-end bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900 rounded-tr-none"
                                            : "self-start bg-blue-600 text-white dark:bg-blue-600 rounded-tl-none"
                                    )}
                                >
                                    <span className="whitespace-pre-wrap leading-relaxed">
                                        {message.content}
                                    </span>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}
                </div>

                {/* Input Form Footer */}
                <div className="pt-3 border-t mt-3 bg-gray-50 dark:bg-gray-900">
                    <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
                        <input
                            type="text"
                            onChange={handleInputChange}
                            value={input}
                            placeholder="Ask AI anything..."
                            className="grow h-10 rounded-full border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-950 px-4 text-sm outline-none focus:border-blue-500 transition shadow-inner dark:text-white"
                        />
                        <Button 
                            type="submit" 
                            size="icon" 
                            disabled={!input.trim() || isLoading}
                            className="rounded-full size-10 shrink-0 bg-blue-600 hover:bg-blue-700 text-white transition"
                        >
                            <Send className="size-4" />
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    )
}

export default AskAI