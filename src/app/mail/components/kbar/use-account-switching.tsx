'use client'

import { api } from '@/trpc/react'
import { useRegisterActions } from 'kbar'
import React from 'react'
import { useLocalStorage } from 'usehooks-ts'

const useAccountSwitching = () => {
    const { data: accounts } = api.account.getAccounts.useQuery()
    const [_, setAccountId] = useLocalStorage('accountId', '')

    const mainAction = [{
        id: "accountsAction",
        name: "Switch Account",
        shortcut: ['e', 's'],
        section: "Accounts",
        subtitle: "Toggle between different synced profiles"
    }]

    React.useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            // Meta/Ctrl + 1-9 direct switching mapping handler
            if ((event.metaKey || event.ctrlKey) && /^[1-9]$/.test(event.key)) {
                event.preventDefault();
                const index = parseInt(event.key) - 1;
                if (accounts && accounts.length > index) {
                    setAccountId(accounts[index]!.id);
                }
            }
        };

        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [accounts, setAccountId]);

    useRegisterActions(mainAction.concat((accounts?.map((account) => {
        return {
            id: account.id,
            name: account.name || "Unnamed Account",
            parent: 'accountsAction',
            perform: () => {
                setAccountId(account.id)
            },
            keywords: [account.name, account.emailAddress].filter(Boolean) as string[],
            shortcut: [],
            section: "Accounts",
            subtitle: account.emailAddress,
            priority: 1000
        }
    })) || []), [accounts])
}

export default useAccountSwitching;