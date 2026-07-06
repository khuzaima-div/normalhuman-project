'use client'
import { motion } from 'framer-motion'
import { Input } from '../../components/ui/input'
import { Loader2, Search, X } from 'lucide-react'
import React from 'react'
import { atom, useAtom } from 'jotai'
import { useDebounceValue } from 'usehooks-ts' // text sync optimize karne ke liye best hai
import { api } from '@/trpc/react' // Apne custom tRPC client wrapper ka sahi path check kar lein
import { useAccountSelection } from '@/hooks/use-account-selection'

export const isSearchingAtom = atom(false)
export const searchValueAtom = atom('')

// Search results ko global state mein rakhne ke liye naya atom takay Display component isko padh sake
export const searchResultsAtom = atom<any>(null)

const SearchBar = () => {
    const [searchValue, setSearchValue] = useAtom(searchValueAtom)
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)
    const [, setSearchResults] = useAtom(searchResultsAtom)
    
    const { accountId } = useAccountSelection()

    // Debounce value lagayi hai taake har ek keypress par backend call na jaye aur DB pool save rahe
    const [debouncedSearchValue] = useDebounceValue(searchValue, 500)
    const ref = React.useRef<HTMLInputElement>(null)

    // tRPC hook initialization
    const searchMutation = api.search.search.useMutation({
        onSuccess: (data) => {
            setSearchResults(data)
        },
        onError: (err) => {
            console.error("❌ Frontend Search Exception:", err)
        }
    })

    // Effect hook to fire mutations sequentially when input relaxes
    React.useEffect(() => {
        if (!debouncedSearchValue.trim() || !accountId) {
            setSearchResults(null)
            return
        }

        searchMutation.mutate({
            accountId,
            query: debouncedSearchValue,
        })
    }, [accountId, debouncedSearchValue, searchMutation, setSearchResults])

    const handleBlur = () => {
        if (!!searchValue) return
        setIsSearching(false)
    }

    // Escape key shortcuts to capture workspace actions flawlessly
    React.useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleBlur()
                ref.current?.blur()
            }
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                e.preventDefault();
                ref.current?.focus();
            }
        }
        window.addEventListener('keydown', handleEscape)
        return () => window.removeEventListener('keydown', handleEscape)
    }, [setIsSearching, searchValue, isSearching])

    return (
        <div className="bg-background/95 p-4 backdrop-blur supports-backdrop-filter:bg-background/60">
            <motion.div className="relative" layoutId="search-bar">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    ref={ref}
                    placeholder="Search"
                    className="pl-8"
                    value={searchValue}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchValue(e.target.value)}
                    onFocus={() => setIsSearching(true)}
                    onBlur={handleBlur}
                />
                <div className="absolute right-2 top-2.5 flex items-center gap-2">
                    {searchMutation.isPending && <Loader2 className="h-4 w-4 animate-spin text-gray-400" />}
                    <button
                        className="rounded-sm hover:bg-gray-800 p-0.5"
                        onClick={() => {
                            setSearchValue('')
                            setSearchResults(null)
                            setIsSearching(false)
                            ref.current?.blur()
                        }}
                    >
                        <X className="size-4 text-gray-400" />
                    </button>
                </div>
            </motion.div>
        </div>
    )
}

export default SearchBar