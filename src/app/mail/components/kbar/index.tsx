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
import useAccountSwitching from "./use-account-switching";
import { useMailNavigation } from "@/hooks/use-mail-navigation";

export default function KBar({ children }: { children: React.ReactNode }) {
    const { setView, setInboxFilter } = useMailNavigation()

    const actions: Action[] = [
        {
            id: "inboxAction",
            name: "Inbox",
            shortcut: ["g", "i"],
            keywords: "inbox messages mail",
            section: "Navigation",
            subtitle: "View your primary inbox feed",
            perform: () => setView('inbox'),
        },
        {
            id: "draftsAction",
            name: "Drafts",
            shortcut: ['g', 'd'],
            keywords: "drafts saved un-sent",
            priority: Priority.HIGH,
            subtitle: "View your compiled drafts",
            section: "Navigation",
            perform: () => setView('draft'),
        },
        {
            id: "sentAction",
            name: "Sent",
            shortcut: ['g', "s"],
            keywords: "sent outbox mail out",
            section: "Navigation",
            subtitle: "View successfully sent emails",
            perform: () => setView('sent'),
        },
        {
            id: "pendingAction",
            name: "See Pending",
            shortcut: ['g', "p"],
            keywords: 'pending, undone, not done, active',
            section: "Navigation",
            subtitle: "View the pending emails",
            perform: () => setInboxFilter('active'),
        },
        {
            id: "doneAction",
            name: "See Done",
            shortcut: ['g', "u"],
            keywords: "done completed finished archive",
            section: "Navigation",
            subtitle: "View completed emails",
            perform: () => setInboxFilter('done'),
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
                <KBarPositioner className="fixed inset-0 z-50 flex items-start justify-center bg-background/50 p-4 backdrop-blur-sm sm:p-6">
                    <KBarAnimator className="relative mt-[10vh] w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-token-lg">
                        <div className="border-b border-border">
                            <KBarSearch 
                                defaultPlaceholder="Type a command or search…"
                                className="w-full border-none bg-transparent px-5 py-4 text-body text-foreground outline-none placeholder:text-muted-foreground focus:outline-none focus:ring-0" 
                            />
                        </div>
                        <div className="max-h-80 overflow-y-auto pb-2 scrollbar-elegant">
                            <RenderResults />
                        </div>
                    </KBarAnimator>
                </KBarPositioner>
            </KBarPortal>
            {children}
        </>
    )
}
