'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, ChevronsUpDown, Plus } from 'lucide-react'
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
import { toast } from 'sonner'

export function OrganizationSwitcher() {
    const [open, setOpen] = useState(false)
    const [organizations, setOrganizations] = useState<Organization[]>([])
    const [loading, setLoading] = useState(true)
    const { currentOrganization, setCurrentOrganization } = useAppStore()
    const router = useRouter()

    useEffect(() => {
        loadOrganizations()
    }, [])

    const loadOrganizations = async () => {
        try {
            const orgs = await getUserOrganizations()
            setOrganizations(orgs)

            // Si aucune organisation active, sélectionner la première
            if (!currentOrganization && orgs.length > 0) {
                setCurrentOrganization(orgs[0])
            }
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de charger les organisations',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSelectOrganization = (org: Organization) => {
        setCurrentOrganization(org)
        setOpen(false)
        toast.success('Organisation changée', {
            description: `Vous êtes maintenant dans ${org.name}`,
        })
        router.refresh()
    }

    const handleCreateOrganization = () => {
        setOpen(false)
        // TODO: Ouvrir un dialog pour créer une organisation (Étape 4)
        toast.info('Fonctionnalité à venir', {
            description: 'La création d\'organisation sera disponible à l\'étape 4',
        })
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

    if (organizations.length === 0) {
        return (
            <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleCreateOrganization}
            >
                <Plus className="mr-2 h-4 w-4" />
                Créer une organisation
            </Button>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className="w-full justify-between"
                >
                    <div className="flex items-center gap-2 truncate">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-semibold text-primary-foreground">
                            {currentOrganization?.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate">{currentOrganization?.name || 'Sélectionner...'}</span>
                    </div>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] p-0">
                <Command>
                    <CommandInput placeholder="Rechercher une organisation..." />
                    <CommandList>
                        <CommandEmpty>Aucune organisation trouvée.</CommandEmpty>
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
                                    <div className="flex flex-1 items-center justify-between">
                                        <span>{org.name}</span>
                                        <span className="text-xs text-muted-foreground capitalize">
                                            {org.role}
                                        </span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
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
    )
}
