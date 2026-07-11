'use client'



import React from 'react'

import { useEditor, EditorContent, type Editor } from '@tiptap/react'

import StarterKit from '@tiptap/starter-kit'

import Text from '@tiptap/extension-text'

import TipTapMenuBar from './menu-bar'

import TagInput from './tag-input'

import { Button } from '@/components/ui/button'

import { api } from '@/trpc/react'

import { useThreads } from '@/hooks/use-threads'

import { ChevronDown, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'



import { generate, generateEmail } from '@/components/email-editor/action'

import { readStreamableValue } from 'ai/rsc'

import { turndown } from '@/lib/turndown'

import AIComposeButton from './ai-compose-button'

function isEditorReady(editor: Editor | null): editor is Editor {
    return !!editor && !editor.isDestroyed && !!editor.view?.state
}

function safeGetEditorHTML(editor: Editor | null): string {
    if (!isEditorReady(editor)) return ""

    try {
        return editor.getHTML()
    } catch (error) {
        console.warn("Tiptap schema serialization lag detected, falling back to text state:", error)
        try {
            const text = editor.getText()?.trim()
            return text ? `<p>${text}</p>` : ""
        } catch {
            return ""
        }
    }
}

function safeGetEditorText(editor: Editor | null): string {
    if (!isEditorReady(editor)) return ""

    try {
        return editor.getText() ?? ""
    } catch (error) {
        console.warn("Tiptap text read failed:", error)
        return ""
    }
}

function safeSetEditorContent(editor: Editor | null, html: string): boolean {
    if (!isEditorReady(editor)) return false

    try {
        editor.commands.setContent(html)
        return true
    } catch (error) {
        console.warn("Tiptap setContent failed:", error)
        return false
    }
}

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

    const [editorHeight, setEditorHeight] = React.useState<number>(88)



    const { accountId } = useThreads()



    const { data: suggestionsData } = api.account.getSuggestions.useQuery({

        accountId: accountId ?? ''

    }, {

        enabled: !!accountId

    })



    const suggestions = suggestionsData?.map(s => s.address) || []

    const aiGenerateCompletionRef = React.useRef<(currentText: string) => void>(() => {})

    const CustomText = React.useMemo(
        () =>
            Text.extend({
                addKeyboardShortcuts() {
                    return {
                        'Meta-j': () => {
                            aiGenerateCompletionRef.current(safeGetEditorText(this.editor))
                            return true
                        },
                        'Ctrl-j': () => {
                            aiGenerateCompletionRef.current(safeGetEditorText(this.editor))
                            return true
                        },
                    }
                },
            }),
        [],
    )

    const editor = useEditor({
        autofocus: false,
        extensions: [StarterKit, CustomText],
        onCreate: ({ editor: createdEditor }) => {
            setValue(safeGetEditorHTML(createdEditor))
            setEditorHeight(Math.max(88, (createdEditor.view.dom as HTMLElement).scrollHeight))
            if (onEditorInitialize) onEditorInitialize(createdEditor)
        },
        onUpdate: ({ editor: updatedEditor }) => {
            setValue(safeGetEditorHTML(updatedEditor))
            setEditorHeight(Math.max(88, (updatedEditor.view.dom as HTMLElement).scrollHeight))
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert focus:outline-none min-h-[5.5rem] text-sm leading-relaxed text-zinc-700 dark:text-zinc-300 w-full max-w-none cursor-text px-1 py-1',
            },
        },
    })

    const aiGenerateCompletion = React.useCallback(
        async (currentText: string) => {
            if (!isEditorReady(editor)) return

            try {
                const recipient = to?.[0] || toValues?.[0]?.value || 'recipient'
                const { output } = await generate(currentText, subject, recipient)

                let accumulatedHTML = safeGetEditorHTML(editor)

                for await (const delta of readStreamableValue(output)) {
                    if (!delta || !isEditorReady(editor)) continue

                    accumulatedHTML += delta
                    safeSetEditorContent(editor, accumulatedHTML)
                }
            } catch (error) {
                console.error("Autocomplete failed:", error)
            }
        },
        [editor, subject, to, toValues],
    )

    const handleAIDraftGeneration = React.useCallback(
        async (promptInput: string) => {
            if (!isEditorReady(editor)) return

            try {
                let finalContext = ""

                if (replyToContent) {
                    finalContext = turndown.turndown(replyToContent)
                } else {
                    finalContext = turndown.turndown(safeGetEditorHTML(editor))
                }

                const { output } = await generateEmail(finalContext, promptInput)

                if (isEditorReady(editor)) {
                    editor.commands.clearContent()
                }

                let accumulatedHTML = ""

                for await (const delta of readStreamableValue(output)) {
                    if (!delta || !isEditorReady(editor)) continue

                    accumulatedHTML += delta
                    safeSetEditorContent(editor, accumulatedHTML)
                }
            } catch (error) {
                console.error("AI Draft Generation failed:", error)
            }
        },
        [editor, replyToContent],
    )

    React.useEffect(() => {
        aiGenerateCompletionRef.current = aiGenerateCompletion
    }, [aiGenerateCompletion])

    React.useEffect(() => {
        if (editor && onEditorInitialize) {
            onEditorInitialize(editor)
        }
    }, [editor, onEditorInitialize])

    React.useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            const isModifier = event.ctrlKey || event.metaKey
            if (!isModifier || event.key.toLowerCase() !== 'j') return
            if (!isEditorReady(editor) || !editor.view?.hasFocus()) return

            event.preventDefault()
            void aiGenerateCompletion(safeGetEditorText(editor))
        }

        window.addEventListener('keydown', handleShortcut)
        return () => {
            window.removeEventListener('keydown', handleShortcut)
        }
    }, [editor, aiGenerateCompletion])



    if (!editor) return null



    const draftRecipient = to?.[0] || toValues?.[0]?.value || fromName || 'recipient'



    const handleSendWithReset = async () => {

        await handleSend(value)

        editor?.commands.clearContent()

        setEditorHeight(88)

    }



    return (

        <div className="overflow-hidden rounded-2xl border border-zinc-200/60 bg-white shadow-[0_4px_20px_rgba(0,0,0,0.02)] dark:border-zinc-800/60 dark:bg-zinc-900 dark:shadow-[0_4px_24px_rgba(0,0,0,0.25)]">

            <div className="flex items-center justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-zinc-800/60">

                <button

                    type="button"

                    onClick={(e) => {

                        e.stopPropagation()

                        setIsExpanded((prev) => !prev)

                    }}

                    className="inline-flex items-center gap-2 rounded-full px-1 py-1 text-xs font-medium tracking-tight text-zinc-500 transition-all duration-200 ease-out hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"

                >

                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">

                        Reply

                    </span>

                    <span className="max-w-40 truncate text-zinc-500 dark:text-zinc-400">{draftRecipient}</span>

                    <ChevronDown className={cn("size-3.5 transition-transform duration-200", isExpanded && "rotate-180")} />

                </button>



                <div className="flex items-center gap-3">

                    <AIComposeButton

                        isComposing={isExpanded}

                        onGenerate={handleAIDraftGeneration}

                    />

                    <TipTapMenuBar editor={editor} />

                </div>

            </div>



            {isExpanded && (
                <div
                    className="shrink-0 space-y-2 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800/60"
                    onClick={(e) => e.stopPropagation()}
                >
                    <TagInput
                        minimal
                        label="To"
                        suggestions={suggestions}
                        value={toValues}
                        onChange={(values) => onToChange ? onToChange(values) : setToValues(values)}
                        placeholder="Add recipients"
                    />
                    <TagInput
                        minimal
                        label="Cc"
                        suggestions={suggestions}
                        value={ccValues}
                        onChange={(values) => onCcChange ? onCcChange(values) : setCcValues(values)}
                        placeholder="Add recipients"
                    />
                    <div className="flex items-center gap-3 rounded-lg bg-slate-50/60 px-2 py-1.5 transition-all duration-200 focus-within:ring-1 focus-within:ring-zinc-200/70 dark:bg-zinc-900/50 dark:focus-within:ring-zinc-800">
                        <span className="w-12 shrink-0 select-none text-xs font-medium text-zinc-500 dark:text-zinc-500">
                            Subject
                        </span>
                        <input
                            value={subject}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                            placeholder="Re:"
                            className="w-full border-none bg-transparent px-0 text-sm font-medium text-zinc-900 outline-none ring-0 placeholder:text-zinc-400 focus:outline-none focus:ring-0 dark:text-zinc-100 dark:placeholder:text-zinc-500"
                        />
                    </div>
                </div>
            )}



            <div className="px-5 py-4">

                <EditorContent

                    editor={editor}

                    className="min-h-[5.5rem] w-full"

                    style={{ minHeight: 88, height: `${editorHeight}px`, overflow: 'hidden' }}

                />

            </div>



            <div

                className="flex items-center justify-between gap-4 border-t border-zinc-100 px-5 py-4 dark:border-zinc-800/60"

                onClick={(e) => e.stopPropagation()}

            >

                <span className="text-xs text-zinc-400 dark:text-zinc-500">

                    Tip: Press{' '}

                    <kbd className="rounded-md border border-zinc-200/70 bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">

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

                    className="h-9 rounded-xl bg-zinc-900 px-5 text-sm font-semibold tracking-tight text-white shadow-sm transition-all duration-200 ease-out hover:bg-zinc-800 active:scale-[0.98] dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200"

                >

                    {isSending ? (

                        <span className="flex items-center gap-1.5">

                            <Loader2 className="size-3.5 animate-spin" /> Sending...

                        </span>

                    ) : (

                        'Send'

                    )}

                </Button>

            </div>

        </div>

    )

}


