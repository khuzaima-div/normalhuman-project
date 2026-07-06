'use client'

import {
    type Action,
    KBarProvider,
    KBarPortal,
    KBarPositioner,
    KBarAnimator,
    KBarSearch,
    Priority,
} from "kbar";
import RenderResults from "./RenderResult";
import { useLocalStorage } from "usehooks-ts";
import useAccountSwitching from "./use-account-switching";
import { useThread } from "@/hooks/use-thread";

export default function KBar({ children }: { children: React.ReactNode }) {
    const [_, setTab] = useLocalStorage(`normalhuman-tab`, 'inbox')
    const [threadId, setThreadId] = useThread()
    const [done, setDone] = useLocalStorage('normalhuman-done', false)

    const actions: Action[] = [
        {
            id: "inboxAction",
            name: "Inbox",
            shortcut: ["g", "i"],
            keywords: "inbox messages mail",
            section: "Navigation",
            subtitle: "View your primary inbox feed",
            perform: () => {
                setTab('inbox')
            },
        },
        {
            id: "draftsAction",
            name: "Drafts",
            shortcut: ['g', 'd'],
            keywords: "drafts saved un-sent",
            priority: Priority.HIGH,
            subtitle: "View your compiled drafts",
            section: "Navigation",
            perform: () => {
                setTab('drafts')
            },
        },
        {
            id: "sentAction",
            name: "Sent",
            shortcut: ['g', "s"],
            keywords: "sent outbox mail out",
            section: "Navigation",
            subtitle: "View successfully sent emails",
            perform: () => {
                setTab('sent')
            },
        },
        {
            id: "pendingAction",
            name: "See Pending",
            shortcut: ['g', "p"], // Fixed shortcut conflict
            keywords: 'pending, undone, not done, active',
            section: "Navigation",
            subtitle: "View the pending emails",
            perform: () => {
                setDone(false)
            },
        },
        {
            id: "doneAction",
            name: "See Done",
            shortcut: ['g', "u"],
            keywords: "done completed finished archieve",
            section: "Navigation",
            subtitle: "View compiled done emails",
            perform: () => {
                setDone(true)
            },
        },
    ];

    return (
        <KBarProvider actions={actions}>
            <ActualComponent>
                {children}
            </ActualComponent>
        </KBarProvider>
    )
}

const ActualComponent = ({ children }: { children: React.ReactNode }) => {
    useAccountSwitching()

    return (
        <>
            <KBarPortal>
                <KBarPositioner className="fixed inset-0 bg-zinc-950/40 dark:bg-zinc-950/60 backdrop-blur-sm p-4 sm:p-6 z-99999 flex items-start justify-center">
                    <KBarAnimator className="max-w-150 mt-32 w-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-2xl border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden relative">
                        <div className="bg-white dark:bg-zinc-900">
                            <div className="border-b border-zinc-200 dark:border-zinc-800">
                                <KBarSearch 
                                    defaultPlaceholder="Type a command or search actions..."
                                    className="py-3.5 px-5 text-sm w-full bg-transparent outline-none border-none focus:outline-none focus:ring-0 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500" 
                                />
                            </div>
                            <div className="max-h-87.5 overflow-y-auto pb-2">
                                <RenderResults />
                            </div>
                        </div>
                    </KBarAnimator>
                </KBarPositioner>
            </KBarPortal>
            {children}
        </>
    )
}