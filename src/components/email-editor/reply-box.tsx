// src/app/mail/components/email-editor/reply-box.tsx
'use client'

import React from 'react'
import EmailEditor from './email-editor'
import { useThread } from '@/hooks/use-thread'
import { useThreads } from '@/hooks/use-threads'
import { api, type RouterOutputs } from '@/trpc/react'
import { toast } from 'sonner'

const ReplyBox = () => {
    const [threadId] = useThread()
    const { accountId } = useThreads()

    const { data: replyDetails, isLoading, error } = api.account.getReplyDetails.useQuery({
        accountId: accountId ?? '',
        threadId: threadId ?? '',
    }, {
        enabled: !!threadId && !!accountId,
    })

    React.useEffect(() => {
        if (error) {
            console.error("DEBUG: api.account.getReplyDetails error", error)
        }
    }, [error])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card p-8 shadow-token-sm">
                <div className="flex items-center gap-3 text-body text-muted-foreground">
                    <span className="inline-block size-4 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-primary" />
                    <span>Loading the reply editor…</span>
                </div>
            </div>
        )
    }

    const fallbackReplyDetails: NonNullable<RouterOutputs['account']['getReplyDetails']> = {
        subject: '',
        to: [],
        cc: [],
        from: { name: '', address: '' },
        id: '',
    }

    if (!replyDetails) {
        console.warn('DEBUG: getReplyDetails returned no data, rendering fallback editor', { threadId, accountId, error })
    }

    return <Component replyDetails={replyDetails ?? fallbackReplyDetails} />
}

const Component = ({ replyDetails }: { replyDetails: RouterOutputs['account']['getReplyDetails'] }) => {
    const [threadId] = useThread()
    const { accountId } = useThreads()
    const [editorInstance, setEditorInstance] = React.useState<any>(null)

    // Dynamic subject state generation logic
    const [subject, setSubject] = React.useState<string>('Re:')

    // Filtered mapped default elements
    const [toValues, setToValues] = React.useState<{ label: string, value: string }[]>([])
    const [ccValues, setCcValues] = React.useState<{ label: string, value: string }[]>([])

    // Fetch account separately to secure sender email fallback if query is slow
    const { data: account } = api.mail.getMyAccount.useQuery({ accountId: accountId ?? '' }, { enabled: !!accountId })

    const sendEmail = api.mail.sendEmail.useMutation()

    // Sync state variations instantly when current active thread node switches
    React.useEffect(() => {
        if (!replyDetails || !threadId) return;

        setSubject(() => {
            if (!replyDetails.subject?.trim()) {
                return 'Re:'
            }
            return replyDetails.subject.startsWith('Re:')
                ? replyDetails.subject
                : `Re: ${replyDetails.subject}`
        })

        setToValues(replyDetails.to.map(to => ({ label: to.address ?? to.name ?? "", value: to.address })))
        setCcValues(replyDetails.cc.map(cc => ({ label: cc.address ?? cc.name ?? "", value: cc.address })))
    }, [replyDetails?.id, replyDetails?.subject, replyDetails?.to, replyDetails?.cc, threadId])

    const handleSend = async (htmlValue: string) => {
        // 🔥 VALIDATION FIX: Ensure accountId is present, relax tight object validation
        if (!accountId) {
            toast.error("No active account detected.")
            return;
        }

        // Setup clean dynamic fallback for sender email address
        const senderAddress = replyDetails?.from?.address || account?.emailAddress || "";
        const senderName = replyDetails?.from?.name || account?.name || "Me";

        if (!senderAddress) {
            toast.error("Reply details are still loading or incomplete.")
            return;
        }
        
        sendEmail.mutate({
            accountId,
            threadId: threadId ?? undefined,
            body: htmlValue,
            subject,
            from: { name: senderName, address: senderAddress },
            to: toValues.map(to => ({ name: to.label, address: to.value })),
            cc: ccValues.map(cc => ({ name: cc.label, address: cc.value })),
            replyTo: { name: senderName, address: senderAddress },
            inReplyTo: replyDetails?.id || undefined, // Connected directly with parent email internetMessageId
        }, {
            onSuccess: () => {
                toast.success("Email sent successfully!")
                if (editorInstance) {
                    editorInstance.commands.clearContent() // Wipes out Tiptap body space cleanly on success
                }
            },
            onError: (err: any) => {
                toast.error(err.message || "Failed to deliver email message")
            }
        })
    }

    return (
        <EmailEditor
            toValues={toValues}
            setToValues={setToValues}
            ccValues={ccValues}
            setCcValues={setCcValues}
            onToChange={(values) => setToValues(values)}
            onCcChange={(values) => setCcValues(values)}
            subject={subject}
            setSubject={setSubject}
            to={toValues.map(to => to.value)}
            handleSend={handleSend}
            isSending={sendEmail.isPending}
            onEditorInitialize={(editor) => setEditorInstance(editor)} // Dynamic instance streaming
        />
    )
}

export default ReplyBox;