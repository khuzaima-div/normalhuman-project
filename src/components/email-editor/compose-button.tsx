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
            onSuccess: () => {
                toast.success("Email sent successfully")
                // Reset states after successful tracking
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
                {/* 🎨 Compact Button Layout - Premium Dark Mode Styling */}
                <Button 
                    className="gap-2 bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-zinc-200/90 shadow-sm transition-all duration-200 font-medium px-4 h-10 rounded-xl"
                >
                    <Pencil className='size-4' />
                    <span>Compose</span>
                </Button>
            </DrawerTrigger>
            
            {/* 🌌 Fixed Drawer Content Layer Container with responsive tracking limits */}
            <DrawerContent className="bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 max-h-[85vh]">
                <div className="mx-auto w-full max-w-4xl p-4 overflow-y-auto">
                    <DrawerHeader className="px-0 pt-0 pb-4">
                        <DrawerTitle className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                            Compose Email
                        </DrawerTitle>
                    </DrawerHeader>
                    
                    {/* Inject updated Props directly corresponding with your recent Editor types */}
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
                        fromName={account?.name}
                    />
                </div>
            </DrawerContent>
        </Drawer>
    )
}

export default ComposeButton