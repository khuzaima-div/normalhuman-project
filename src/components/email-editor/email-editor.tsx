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

import { toast } from 'sonner'

import AIComposeButton from './ai-compose-button'

function getAiErrorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message : String(error ?? '')
    if (message.includes('Limit reached')) {
        return 'You have reached your free daily limit.'
    }
    return 'Something went wrong. Please try again.'
}

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
            setEditorHeight(Math.max(88, (createdEditor.view.dom).scrollHeight))
            if (onEditorInitialize) onEditorInitialize(createdEditor)
        },
        onUpdate: ({ editor: updatedEditor }) => {
            setValue(safeGetEditorHTML(updatedEditor))
            setEditorHeight(Math.max(88, (updatedEditor.view.dom).scrollHeight))
        },
        editorProps: {
            attributes: {
                class: 'prose dark:prose-invert focus:outline-none min-h-[5.5rem] text-body leading-relaxed text-foreground w-full max-w-none cursor-text px-1 py-1',
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
                toast.error(getAiErrorMessage(error))
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
                throw error
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

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-token-sm">

            <div className="flex items-center justify-between gap-4 border-b border-border px-4 py-3 sm:px-5">

                <button

                    type="button"

                    onClick={(e) => {

                        e.stopPropagation()

                        setIsExpanded((prev) => !prev)

                    }}

                    className="inline-flex items-center gap-2 rounded-lg px-1 py-1 text-caption font-medium tracking-tight text-muted-foreground transition-colors duration-200 ease-out hover:text-foreground"

                >

                    <span className="rounded-md bg-muted px-2.5 py-1 text-foreground">

                        Reply

                    </span>

                    <span className="max-w-40 truncate">{draftRecipient}</span>

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
                    className="shrink-0 space-y-2 border-b border-border px-4 py-3 sm:px-5 dark:border-border"
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
                    <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-2 py-1.5 transition-all duration-200 focus-within:ring-2 focus-within:ring-ring/30">
                        <span className="w-12 shrink-0 select-none text-caption font-medium text-muted-foreground">
                            Subject
                        </span>
                        <input
                            value={subject}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubject(e.target.value)}
                            placeholder="Re:"
                            className="w-full border-none bg-transparent px-0 text-body font-medium text-foreground outline-none ring-0 placeholder:text-muted-foreground focus:outline-none focus:ring-0"
                        />
                    </div>
                </div>
            )}



            <div className="px-4 py-3 sm:px-5 sm:py-4">

                <EditorContent

                    editor={editor}

                    className="min-h-[5.5rem] w-full"

                    style={{ minHeight: 88, height: `${editorHeight}px`, overflow: 'hidden' }}

                />

            </div>



            <div

                className="flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-4"

                onClick={(e) => e.stopPropagation()}

            >

                <span className="text-caption text-muted-foreground">

                    Tip: Press{' '}

                    <kbd className="kbd-hint">

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

                    className="h-9 w-full rounded-lg px-5 text-body font-semibold sm:w-auto"

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


