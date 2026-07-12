'use client'

import { Button } from "@/components/ui/button"
import {
    Drawer,
    DrawerContent,
    DrawerHeader,
    DrawerTitle,
    DrawerTrigger,
} from "@/components/ui/drawer"
import { Pencil } from "lucide-react"

import React from 'react'
import EmailEditor from "./email-editor"
import { api } from "@/trpc/react"
import { useLocalStorage } from "usehooks-ts"
import { toast } from "sonner"

const ComposeButton = () => {
    const [open, setOpen] = React.useState(false)
    const [accountId] = useLocalStorage('accountId', '')
    const [toValues, setToValues] = React.useState<{ label: string; value: string; }[]>([])
    const [ccValues, setCcValues] = React.useState<{ label: string; value: string; }[]>([])
    const [subject, setSubject] = React.useState<string>('')
    const { data: account } = api.mail.getMyAccount.useQuery({ accountId }, { enabled: !!accountId })

    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'c' && (event.ctrlKey || event.metaKey) && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                event.preventDefault();
                setOpen(true);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const utils = api.useUtils()
    const sendEmail = api.mail.sendEmail.useMutation()

    const handleSend = async (value: string) => {
        if (!account) {
            toast.error("No active account detected")
            return
        }
        
        sendEmail.mutate({
            accountId,
            threadId: undefined,
            body: value,
            subject,
            from: { name: account?.name ?? 'Me', address: account?.emailAddress ?? 'me@example.com' },
            to: toValues.map(to => ({ name: to.label, address: to.value })),
            cc: ccValues.map(cc => ({ name: cc.label, address: cc.value })),
            replyTo: { name: account?.name ?? 'Me', address: account?.emailAddress ?? 'me@example.com' },
            inReplyTo: undefined,
        }, {
            onSuccess: async () => {
                toast.success("Email sent successfully")
                await utils.account.getThreads.invalidate()
                setToValues([])
                setCcValues([])
                setSubject('')
                setOpen(false)
            },
            onError: (error) => {
                console.error(error)
                toast.error(error.message || "Failed to send email")
            }
        })
    }

    return (
        <Drawer open={open} onOpenChange={setOpen}>
            <DrawerTrigger asChild>
                <Button size="sm" className="h-9 gap-1.5 rounded-lg px-3 font-medium shadow-token-xs">
                    <Pencil className="size-3.5" />
                    <span className="hidden sm:inline">Compose</span>
                </Button>
            </DrawerTrigger>
            
            <DrawerContent className="max-h-[85vh] border-border bg-background">
                <div className="mx-auto w-full max-w-4xl overflow-y-auto p-4 sm:p-6">
                    <DrawerHeader className="px-0 pt-0 pb-4">
                        <DrawerTitle className="text-title font-semibold tracking-tight">
                            Compose Email
                        </DrawerTitle>
                    </DrawerHeader>
                    
                    <EmailEditor
                        toValues={toValues}
                        setToValues={setToValues}
                        ccValues={ccValues}
                        setCcValues={setCcValues}
                        onToChange={setToValues}
                        onCcChange={setCcValues}
                        subject={subject}
                        setSubject={setSubject}
                        to={toValues.map(to => to.value)}
                        handleSend={handleSend}
                        isSending={sendEmail.isPending}
                        defaultToolbarExpanded={true}
                        fromName={account?.name ?? undefined}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default ComposeButton
