'use client'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Loader2, Search, X } from 'lucide-react'
import React from 'react'
import { atom, useAtom } from 'jotai'
import { useDebounceValue } from 'usehooks-ts'
import { api } from '@/trpc/react'
import { useAccountSelection } from '@/hooks/use-account-selection'
import type { OramaSearchResult } from '@/types'

export const isSearchingAtom = atom(false)
export const searchValueAtom = atom('')
export const searchResultsAtom = atom<OramaSearchResult | null>(null)

const SearchBar = () => {
    const [searchValue, setSearchValue] = useAtom(searchValueAtom)
    const [isSearching, setIsSearching] = useAtom(isSearchingAtom)
    const [, setSearchResults] = useAtom(searchResultsAtom)
    
    const { accountId } = useAccountSelection()
    const [debouncedSearchValue] = useDebounceValue(searchValue, 500)
    const ref = React.useRef<HTMLInputElement>(null)

    const searchMutation = api.search.search.useMutation({
        onSuccess: (data) => {
            setSearchResults(data as OramaSearchResult)
        },
        onError: (err) => {
            console.error("Search error:", err)
        }
    })

    React.useEffect(() => {
        if (!debouncedSearchValue.trim() || !accountId) {
            setSearchResults(null)
            return
        }

        searchMutation.mutate({
            accountId,
            query: debouncedSearchValue,
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [accountId, debouncedSearchValue])

    const handleBlur = () => {
        if (searchValue) return
        setIsSearching(false)
    }

    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                handleBlur()
                ref.current?.blur()
            }
            if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName || '')) {
                e.preventDefault()
                ref.current?.focus()
            }
        }
        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [searchValue])

    return (
        <div className="shrink-0 px-4 pb-3 pt-0">
            <motion.div className="relative" layoutId="search-bar">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input
                    ref={ref}
                    placeholder="Search emails…"
                    className="h-10 rounded-lg border-border bg-muted/50 pl-9 pr-16 text-body shadow-none transition-[background-color,border-color,box-shadow] duration-200 placeholder:text-muted-foreground focus-visible:border-ring focus-visible:bg-background focus-visible:ring-[3px] focus-visible:ring-ring/30"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onFocus={() => setIsSearching(true)}
                    onBlur={handleBlur}
                    aria-label="Search emails"
                />
                <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
                    {searchMutation.isPending && (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" aria-label="Searching" />
                    )}
                    {(searchValue || isSearching) ? (
                      <button
                        type="button"
                        className="rounded-md p-1.5 text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                        aria-label="Clear search"
                        onClick={() => {
                            setSearchValue('')
                            setSearchResults(null)
                            setIsSearching(false)
                            ref.current?.blur()
                        }}
                      >
                        <X className="size-4" />
                      </button>
                    ) : (
                      <kbd className="kbd-hint hidden sm:inline-flex">/</kbd>
                    )}
                </div>
            </motion.div>
        </div>
    )
}

export default SearchBar
