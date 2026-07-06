'use client'

import React from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Text from '@tiptap/extension-text'
import TipTapMenuBar from './menu-bar'
import TagInput from './tag-input'
import { Button } from '@/components/ui/button'
import { api } from '@/trpc/react'
import { useThreads } from '@/hooks/use-threads'
import { Loader2 } from 'lucide-react'
import { Separator } from '@/components/ui/separator'

// NEW IMPORTS FOR AI STREAMING AND TURNDOWN
import { generate, generateEmail } from '@/components/email-editor/action'
import { readStreamableValue } from 'ai/rsc'
import { turndown } from '@/lib/turndown'
import AIComposeButton from './ai-compose-button'

type Props = {
    subject: string
    setSubject: (value: string) => void

    toValues: { label: string; value: string }[]
    setToValues: (value: { label: string; value: string }[]) => void
    onToChange?: (value: { label: string; value: string }[]) => void

    ccValues: { label: string; value: string }[]
    setCcValues: (value: { label: string; value: string }[]) => void
    onCcChange?: (value: { label: string; value: string }[]) => void

    to: string[]
    handleSend: (value: string) => void
    isSending: boolean

    onEditorInitialize?: (editor: any) => void
    defaultToolbarExpanded?: boolean
    fromName?: string
    
    replyToContent?: string 
}

export default function EmailEditor({
    subject,
    setSubject,
    toValues,
    setToValues,
    onToChange,
    ccValues,
    setCcValues,
    onCcChange,
    to,
    handleSend,
    isSending,
    onEditorInitialize,
    defaultToolbarExpanded,
    fromName,
    replyToContent
}: Props) {
    const [value, setValue] = React.useState<string>('')
    const [isExpanded, setIsExpanded] = React.useState<boolean>(!!defaultToolbarExpanded)
    const [editorHeight, setEditorHeight] = React.useState<number>(72)

    const { accountId } = useThreads()

    const { data: suggestionsData } = api.account.getSuggestions.useQuery({
        accountId: accountId ?? ''
    }, {
        enabled: !!accountId
    })

    const suggestions = suggestionsData?.map(s => s.address) || []

    // 🌟 1. FIX INLINE GHOST AUTOCOMPLETE STREAMING (Meta-j / Ctrl-j)
    const aiGenerateCompletion = async (currentText: string) => {
        if (!editor) return
        try {
            const recipient = to?.[0] || toValues?.[0]?.value || 'recipient'
            const { output } = await generate(currentText, subject, recipient)
            
            // Editor ka pehle se likha hua content aur naye aane wale chunks ko jorne ke liye
            let accumulatedHTML = editor.getHTML()

            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    accumulatedHTML += delta
                    // insertContent ke bajaye setContent use kiya taake stream HTML parse kare
                    editor.commands.setContent(accumulatedHTML)
                }
            }
        } catch (error) {
            console.error("Autocomplete failed:", error)
        }
    }

    // 🌟 2. FIX FULL EMAIL DRAFT GENERATION HANDLER FOR THE BOT BUTTON
    const handleAIDraftGeneration = async (promptInput: string) => {
        if (!editor) return
        try {
            let finalContext = ""
            if (replyToContent) {
                finalContext = turndown.turndown(replyToContent)
            } else {
                finalContext = turndown.turndown(editor.getHTML())
            }
            
            console.log("Sending context to AI:", finalContext ? "Context Available" : "Empty Context")

            const { output } = await generateEmail(finalContext, promptInput)
            
            // Streaming se pehle content clear karte hain
            editor.commands.clearContent()

            // Variable banaya taake chunks jor kar Tiptap ko HTML bhejein
            let accumulatedHTML = ""

            for await (const delta of readStreamableValue(output)) {
                if (delta) {
                    accumulatedHTML += delta
                    // 🎯 MAIN FIX: insertContent hata kar setContent kiya taake tags parse hon
                    editor.commands.setContent(accumulatedHTML)
                }
            }
        } catch (error) {
            console.error("AI Draft Generation failed:", error)
        }
    }

    const CustomText = Text.extend({
        addKeyboardShortcuts() {
            return {
                'Meta-j': () => {
                    aiGenerateCompletion(this.editor.getText())
                    return true
                },
                'Ctrl-j': () => {
                    aiGenerateCompletion(this.editor.getText())
                    return true
                }
            }
        }
    })

    const editor = useEditor({
        autofocus: false,
        extensions: [StarterKit, CustomText],
        onCreate: ({ editor }) => {
            setValue(editor.getHTML())
            setEditorHeight(Math.max(72, (editor.view.dom as HTMLElement).scrollHeight))
            if (onEditorInitialize) onEditorInitialize(editor)
        },
        onUpdate: ({ editor }) => {
            setValue(editor.getHTML())
            setEditorHeight(Math.max(72, (editor.view.dom as HTMLElement).scrollHeight))
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert focus:outline-none text-sm text-zinc-800 dark:text-zinc-200 w-full max-w-none cursor-text p-4'
            }
        }
    })

    React.useEffect(() => {
        if (editor && onEditorInitialize) {
            onEditorInitialize(editor)
        }
    }, [editor, onEditorInitialize])

    React.useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const isModifier = event.ctrlKey || event.metaKey
            if (!isModifier || event.key.toLowerCase() !== 'j') return
            if (!editor?.view?.hasFocus()) return

            event.preventDefault()
            aiGenerateCompletion(editor.getText())
        }

        window.addEventListener('keydown', handleShortcut)
        return () => {
            window.removeEventListener('keydown', handleShortcut)
        }
    }, [editor])

    if (!editor) return null

    const draftRecipient = to?.[0] || toValues?.[0]?.value || fromName || 'recipient'

    const handleSendWithReset = async () => {
        await handleSend(value)
        editor?.commands.clearContent()
        setEditorHeight(72)
    }

    return (
        <div className="flex flex-col overflow-hidden rounded-[1.5rem] border border-zinc-200/70 dark:border-zinc-800/70 bg-white dark:bg-zinc-950 shadow-sm">
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/80 dark:bg-zinc-950/90">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        setIsExpanded((prev) => !prev)
                    }}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-950/20 dark:text-emerald-200"
                >
                    <span>Draft</span>
                    <span className="text-zinc-600 dark:text-zinc-300 font-medium truncate max-w-40">{draftRecipient}</span>
                </button>

                <div className="flex items-center gap-4">
                    <AIComposeButton
                        isComposing={isExpanded}
                        onGenerate={handleAIDraftGeneration}
                    />
                    <TipTapMenuBar editor={editor} />
                </div>
            </div>

            {/* MIDDLE LAYOUT BLOCK: Conditional fields (To, Cc, Subject) */}
            {isExpanded && (
                <div 
                    className="flex flex-col bg-transparent dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-800/60 shrink-0"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="px-4 py-1.5">
                        <TagInput
                            minimal
                            label="To"
                            suggestions={suggestions}
                            value={toValues}
                            onChange={(values) => onToChange ? onToChange(values) : setToValues(values)}
                            placeholder="Add recipients"
                        />
                    </div>
                    <div className="px-4 py-1.5 border-t border-zinc-100 dark:border-zinc-900/20">
                        <TagInput
                            minimal
                            label="Cc"
                            suggestions={suggestions}
                            value={ccValues}
                            onChange={(values) => onCcChange ? onCcChange(values) : setCcValues(values)}
                            placeholder="Add recipients"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-900/20">
                        <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider w-12 select-none">Subject</span>
                        <input
                            value={subject}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                            placeholder="Re:"
                            className="w-full border-none bg-zinc-100/80 dark:bg-zinc-900/80 outline-none ring-0 focus:outline-none focus:ring-0 focus:ring-emerald-400/40 focus:bg-white dark:focus:bg-zinc-950 text-sm font-medium text-zinc-900 dark:text-zinc-100 rounded-lg px-3 py-2 transition-all duration-150"
                        />
                    </div>
                </div>
            )}

            <div className="px-4 py-3 bg-white dark:bg-zinc-950">
                <div className="overflow-hidden rounded-[1.5rem] border border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50 dark:bg-zinc-950 transition-all duration-200">
                    <EditorContent
                        editor={editor}
                        className="prose dark:prose-invert focus:outline-none text-sm text-zinc-800 dark:text-zinc-200 w-full max-w-none cursor-text p-4"
                        style={{ minHeight: 72, height: `${editorHeight}px`, overflow: 'hidden' }}
                    />
                </div>
            </div>

            <Separator className="shrink-0" />

            {/* BOTTOM CONTROL ROW */}
            <div className="py-3 px-4 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Tip: Press{' '}
                    <kbd className="px-2 py-1.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-700">
                        Ctrl + J
                    </kbd>{' '}
                    for AI autocomplete
                </span>

                <Button
                    disabled={isSending}
                    onClick={(e) => {
                        e.stopPropagation()
                        handleSendWithReset()
                    }}
                    className="bg-zinc-950 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-950"
                >
                    {isSending ? (
                        <span className="flex items-center gap-1.5">
                            <Loader2 className="size-3 animate-spin" /> Sending...
                        </span>
                    ) : (
                        'Send'
                    )}
                </Button>
            </div>
        </div>
    )
}