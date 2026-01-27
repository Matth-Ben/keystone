'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, Users, Settings, Star, Clock, Key, Building2 } from 'lucide-react'
import { OrganizationSwitcher } from './organization-switcher'
import { useAppStore, Favorite } from '@/lib/store/app-store'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

const navigation = [
    { name: 'Secrets', href: '/secrets', icon: Key },
    { name: 'Clients', href: '/clients', icon: Users },
    { name: 'Organisation', href: '/organization', icon: Building2 },
    { name: 'Paramètres', href: '/settings', icon: Settings },
]

import { Organization } from '@/lib/store/app-store'

interface SidebarProps {
    favorites: Favorite[]
    organizations: Organization[]
    currentOrgId?: string
}

export function Sidebar({ favorites, organizations, currentOrgId }: SidebarProps) {
    const pathname = usePathname()
    const { recents } = useAppStore()

    return (
        <div className="flex h-full w-64 flex-col border-r bg-background">
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-6">
                <Link href="/secrets" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <span className="text-lg font-bold">K</span>
                    </div>
                    <span className="text-xl font-bold">Keystone</span>
                </Link>
            </div>

            <ScrollArea className="flex-1 px-3 py-4">
                {/* Organization Switcher */}
                <div className="mb-4">
                    <OrganizationSwitcher
                        initialOrganizations={organizations}
                        initialOrgId={currentOrgId}
                    />
                </div>

                <Separator className="my-4" />

                {/* Navigation principale */}
                <div className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                <Separator className="my-4" />

                {/* Favoris */}
                <div>
                    <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground">
                        <Star className="h-3 w-3" />
                        Favoris
                    </div>
                    {favorites.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                            Aucun favori pour le moment
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {favorites.map((fav) => (
                                <Link
                                    key={fav.id}
                                    href={`/${fav.resource_type}s/${fav.resource_id}`}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                    <span className="truncate">{fav.resource_name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>

                <Separator className="my-4" />

                {/* Récents */}
                <div>
                    <div className="mb-2 flex items-center gap-2 px-3 text-xs font-semibold text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Récents
                    </div>
                    {recents.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                            Aucun élément récent
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {recents.map((recent) => (
                                <Link
                                    key={`${recent.type}-${recent.id}`}
                                    href={`/${recent.type}s/${recent.id}`}
                                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                >
                                    <Clock className="h-3 w-3" />
                                    <span className="truncate">{recent.name}</span>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    )
}
