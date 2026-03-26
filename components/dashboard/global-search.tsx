'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, FileText, FolderOpen, Key } from 'lucide-react'
import {
    CommandDialog,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { useAppStore } from '@/lib/store/app-store'
import { globalSearch } from '@/lib/actions/search'
import { useDebounce } from '@/hooks/use-debounce'
import { ViewSecretDialog } from '@/components/secrets/view-secret-dialog'

interface SearchResult {
    type: 'client' | 'project' | 'secret'
    id: string
    name: string
    description?: string
}

interface GlobalSearchProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState<SearchResult[]>([])
    const [loading, setLoading] = useState(false)
    const [viewSecretOpen, setViewSecretOpen] = useState(false)
    const [selectedSecretId, setSelectedSecretId] = useState<string | null>(null)
    const { currentOrganization } = useAppStore()
    const router = useRouter()
    const debouncedQuery = useDebounce(query, 300)

    // Recherche quand la query change
    useEffect(() => {
        if (!debouncedQuery) {
            setResults([])
            return
        }

        const search = async () => {
            setLoading(true)
            try {
                // Passe null si pas d'organisation (mode "Tous mes secrets")
                const searchResults = await globalSearch(
                    debouncedQuery,
                    currentOrganization?.id ?? null
                )
                setResults(searchResults)
            } catch (error) {
                console.error('Search error:', error)
                setResults([])
            } finally {
                setLoading(false)
            }
        }

        search()
    }, [debouncedQuery, currentOrganization])

    const handleSelect = useCallback(
        (result: SearchResult) => {
            if (result.type === 'secret') {
                // Pour un secret, on ouvre la popin de vue au lieu de naviguer
                setSelectedSecretId(result.id)
                setViewSecretOpen(true)
                // On ferme la recherche globale
                onOpenChange(false)
            } else {
                onOpenChange(false)
                setQuery('')
                setResults([])

                // Navigation selon le type
                if (result.type === 'client') {
                    router.push(`/clients/${result.id}`)
                } else if (result.type === 'project') {
                    router.push(`/projects/${result.id}`)
                }
            }
        },
        [router, onOpenChange]
    )

    // Raccourci clavier Cmd+K / Ctrl+K
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                onOpenChange(!open)
            }
        }

        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [open, onOpenChange])

    const getIcon = (type: string) => {
        switch (type) {
            case 'client':
                return FolderOpen
            case 'project':
                return FileText
            case 'secret':
                return Key
            default:
                return Search
        }
    }

    const groupedResults = {
        clients: results.filter((r) => r.type === 'client'),
        projects: results.filter((r) => r.type === 'project'),
        secrets: results.filter((r) => r.type === 'secret'),
    }

    return (
        <>
            <CommandDialog open={open} onOpenChange={onOpenChange} shouldFilter={false}>
                <CommandInput
                    placeholder="Rechercher des clients, projets, secrets..."
                    value={query}
                    onValueChange={setQuery}
                />
                <CommandList>
                    {loading && (
                        <div className="py-6 text-center text-sm text-muted-foreground">
                            Recherche en cours...
                        </div>
                    )}

                    {!loading && query && results.length === 0 && (
                        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                    )}

                    {!loading && groupedResults.clients.length > 0 && (
                        <CommandGroup heading="Clients">
                            {groupedResults.clients.map((result) => {
                                const Icon = getIcon(result.type)
                                return (
                                    <CommandItem
                                        key={`${result.type}-${result.id}`}
                                        value={`${result.type}-${result.id}-${result.name}`}
                                        onSelect={() => handleSelect(result)}
                                        className="cursor-pointer"
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span>{result.name}</span>
                                            {result.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {result.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    )}

                    {!loading && groupedResults.projects.length > 0 && (
                        <CommandGroup heading="Projets">
                            {groupedResults.projects.map((result) => {
                                const Icon = getIcon(result.type)
                                return (
                                    <CommandItem
                                        key={`${result.type}-${result.id}`}
                                        value={`${result.type}-${result.id}-${result.name}`}
                                        onSelect={() => handleSelect(result)}
                                        className="cursor-pointer"
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span>{result.name}</span>
                                            {result.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    Client: {result.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    )}

                    {!loading && groupedResults.secrets.length > 0 && (
                        <CommandGroup heading="Secrets">
                            {groupedResults.secrets.map((result) => {
                                const Icon = getIcon(result.type)
                                return (
                                    <CommandItem
                                        key={`${result.type}-${result.id}`}
                                        value={`${result.type}-${result.id}-${result.name}`}
                                        onSelect={() => handleSelect(result)}
                                        className="cursor-pointer"
                                    >
                                        <Icon className="mr-2 h-4 w-4" />
                                        <div className="flex flex-col">
                                            <span>{result.name}</span>
                                            {result.description && (
                                                <span className="text-xs text-muted-foreground">
                                                    {result.description}
                                                </span>
                                            )}
                                        </div>
                                    </CommandItem>
                                )
                            })}
                        </CommandGroup>
                    )}
                </CommandList>
            </CommandDialog>

            <ViewSecretDialog
                open={viewSecretOpen}
                onOpenChange={setViewSecretOpen}
                secretId={selectedSecretId}
            />
        </>
    )
}
