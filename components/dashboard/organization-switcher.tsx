'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Check, ChevronsUpDown, Plus, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from '@/components/ui/command'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { useAppStore, type Organization } from '@/lib/store/app-store'
import { getUserOrganizations } from '@/lib/actions/organizations'
import { setOrganizationCookie, clearOrganizationCookie } from '@/lib/actions/organization-cookie'
import { CreateOrganizationDialog } from './create-organization-dialog'
import { toast } from 'sonner'

interface OrganizationSwitcherProps {
    initialOrganizations?: Organization[]
    initialOrgId?: string
}

export function OrganizationSwitcher({
    initialOrganizations = [],
    initialOrgId
}: OrganizationSwitcherProps) {
    const [open, setOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)
    const [organizations, setOrganizations] = useState<Organization[]>(initialOrganizations)
    const [loading, setLoading] = useState(initialOrganizations.length === 0)
    const { currentOrganization, setCurrentOrganization } = useAppStore()
    const router = useRouter()
    const pathname = usePathname()

    // Pages qui nécessitent une organisation
    const orgRequiredPaths = ['/clients', '/documents', '/organization']

    // Determine which organization to display:
    // 1. Store value (if hydrated)
    // 2. Or value from initial ID (SSR/Server fallback)
    const displayOrganization = currentOrganization ?? organizations.find(o => o.id === initialOrgId)

    useEffect(() => {
        // Hydrater le store si besoin
        if (initialOrgId && !currentOrganization && initialOrganizations.length > 0) {
            const org = initialOrganizations.find(o => o.id === initialOrgId)
            if (org) setCurrentOrganization(org)
        } else if (organizations.length === 0) {
            // Fallback: charger si pas de données initiales
            loadOrganizations()
        } else {
            setLoading(false)
        }
    }, [])

    const loadOrganizations = async () => {
        try {
            setLoading(true)
            const orgs = await getUserOrganizations()
            setOrganizations(orgs)

            if (!currentOrganization && orgs.length > 0) {
                const defaultOrg = orgs[0]
                setCurrentOrganization(defaultOrg)
                await setOrganizationCookie(defaultOrg.id)
                router.refresh()
            }
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de charger les organisations',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOrganization = async (org: Organization) => {
        setCurrentOrganization(org)
        await setOrganizationCookie(org.id)
        setOpen(false)
        toast.success('Organisation changée', {
            description: `Vous êtes maintenant dans ${org.name}`,
        })
        router.refresh()
    }

    const handleSelectAllSecrets = async () => {
        setCurrentOrganization(null)
        await clearOrganizationCookie()
        setOpen(false)
        toast.success('Mode personnel activé', {
            description: 'Vous voyez maintenant tous vos secrets',
        })

        // Rediriger vers /secrets si on est sur une page qui nécessite une organisation
        const needsRedirect = orgRequiredPaths.some(path =>
            pathname === path || pathname.startsWith(path + '/')
        )

        if (needsRedirect) {
            router.push('/secrets')
        } else {
            router.refresh()
        }
    }

    const handleCreateOrganization = () => {
        setOpen(false)
        setCreateDialogOpen(true)
    }

    const handleOrganizationCreated = () => {
        // Recharger les organisations
        loadOrganizations()
    }

    if (loading) {
        return (
            <div className="flex items-center gap-2 px-2 py-1.5">
                <div className="h-8 w-8 animate-pulse rounded-md bg-muted" />
                <div className="flex-1">
                    <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
            </div>
        )
    }

    // Même sans organisation, on affiche le switcher pour permettre
    // d'utiliser le mode "Tous mes secrets" et de créer une org si besoin

    return (
        <>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between"
                    >
                        <div className="flex items-center gap-2 truncate">
                            {displayOrganization ? (
                                <>
                                    <div
                                        className="flex h-6 w-6 items-center justify-center rounded text-xs font-semibold overflow-hidden relative"
                                        style={{
                                            backgroundColor: displayOrganization.brand_color || 'hsl(var(--primary))',
                                            color: displayOrganization.brand_color ? '#fff' : 'hsl(var(--primary-foreground))'
                                        }}
                                    >
                                        {displayOrganization.logo_url ? (
                                            <>
                                                <div className="absolute inset-0 bg-white/90 rounded" />
                                                <img
                                                    src={displayOrganization.logo_url}
                                                    alt={displayOrganization.name}
                                                    className="h-full w-full object-contain p-1 relative z-10"
                                                />
                                            </>
                                        ) : (
                                            displayOrganization.name.charAt(0).toUpperCase()
                                        )}
                                    </div>
                                    <span className="truncate">{displayOrganization.name}</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex h-6 w-6 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                        <Sparkles className="h-3.5 w-3.5" />
                                    </div>
                                    <span className="truncate">Tous mes secrets</span>
                                </>
                            )}
                        </div>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0">
                    <Command>
                        <CommandInput placeholder="Rechercher une organisation..." />
                        <CommandList>
                            <CommandEmpty>Aucune organisation trouvée.</CommandEmpty>
                            <CommandGroup>
                                <CommandItem
                                    onSelect={handleSelectAllSecrets}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={`mr-2 h-4 w-4 ${!currentOrganization ? 'opacity-100' : 'opacity-0'}`}
                                    />
                                    <div className="flex h-5 w-5 items-center justify-center rounded bg-gradient-to-br from-violet-500 to-purple-600 text-white mr-2">
                                        <Sparkles className="h-3 w-3" />
                                    </div>
                                    <div className="flex flex-1 items-center justify-between">
                                        <span>Tous mes secrets</span>
                                        <span className="text-xs text-muted-foreground">
                                            Personnel
                                        </span>
                                    </div>
                                </CommandItem>
                            </CommandGroup>
                            {organizations.length > 0 && (
                                <>
                                    <CommandSeparator />
                                    <CommandGroup heading="Organisations">
                                        {organizations.map((org) => (
                                            <CommandItem
                                                key={org.id}
                                                onSelect={() => handleSelectOrganization(org)}
                                                className="cursor-pointer"
                                            >
                                                <Check
                                                    className={`mr-2 h-4 w-4 ${currentOrganization?.id === org.id
                                                        ? 'opacity-100'
                                                        : 'opacity-0'
                                                        }`}
                                                />
                                                <div
                                                    className="flex h-5 w-5 items-center justify-center rounded text-xs font-semibold overflow-hidden mr-2 relative"
                                                    style={{
                                                        backgroundColor: org.brand_color || 'hsl(var(--primary))',
                                                        color: org.brand_color ? '#fff' : 'hsl(var(--primary-foreground))'
                                                    }}
                                                >
                                                    {org.logo_url ? (
                                                        <>
                                                            <div className="absolute inset-0 bg-white/90 rounded" />
                                                            <img
                                                                src={org.logo_url}
                                                                alt={org.name}
                                                                className="h-full w-full object-contain relative z-10"
                                                            />
                                                        </>
                                                    ) : (
                                                        org.name.charAt(0).toUpperCase()
                                                    )}
                                                </div>
                                                <div className="flex flex-1 items-center justify-between">
                                                    <span>{org.name}</span>
                                                    <span className="text-xs text-muted-foreground capitalize">
                                                        {org.role}
                                                    </span>
                                                </div>
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </>
                            )}
                            <CommandSeparator />
                            <CommandGroup>
                                <CommandItem onSelect={handleCreateOrganization} className="cursor-pointer">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Créer une organisation
                                </CommandItem>
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>

            <CreateOrganizationDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
                onSuccess={handleOrganizationCreated}
            />
        </>
    )
}
