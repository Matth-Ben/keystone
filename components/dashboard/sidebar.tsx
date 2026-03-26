'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Users, Star, Clock, Key, Building2, FolderOpen, Download, Loader2 } from 'lucide-react'
import { OrganizationSwitcher } from './organization-switcher'
import { SidebarResourceLink } from './sidebar-resource-link'
import { useAppStore, Favorite, Organization } from '@/lib/store/app-store'
import { validateRecents } from '@/lib/actions/recents'
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'

const navigation = [
    { name: 'Secrets', href: '/secrets', icon: Key, requiresOrg: false },
    { name: 'Clients', href: '/clients', icon: Users, requiresOrg: true },
    { name: 'Documents', href: '/documents', icon: FolderOpen, requiresOrg: true },
    { name: 'Organisation', href: '/organization', icon: Building2, requiresOrg: true },
]

interface SidebarProps {
    favorites: Favorite[]
    organizations: Organization[]
    currentOrgId?: string
}

type BrowserType = 'chrome' | 'firefox' | 'safari' | 'edge' | 'unknown'

interface BrowserInfo {
    type: BrowserType
    displayName: string
}

function getBrowserInfo(): BrowserInfo {
    if (typeof window === 'undefined') return { type: 'unknown', displayName: 'navigateur' }

    const userAgent = navigator.userAgent.toLowerCase()

    if (userAgent.includes('firefox')) return { type: 'firefox', displayName: 'Firefox' }
    if (userAgent.includes('safari') && !userAgent.includes('chrome')) return { type: 'safari', displayName: 'Safari' }
    if (userAgent.includes('edg')) return { type: 'edge', displayName: 'Edge' }
    if (userAgent.includes('chrome')) return { type: 'chrome', displayName: 'Chrome' }

    return { type: 'unknown', displayName: 'navigateur' }
}

interface ReleaseAsset {
    name: string
    browser_download_url: string
}

interface GitHubRelease {
    tag_name: string
    assets: ReleaseAsset[]
}

const GITHUB_REPO = 'Matth-Ben/keystone-google-app'
const CACHE_KEY = 'keystone-extension-release'
const CACHE_DURATION = 1000 * 60 * 60 // 1 heure

function getExtensionDownloadUrl(assets: ReleaseAsset[], browserType: BrowserType): string | null {
    // Mapping des navigateurs vers les patterns de fichiers
    const browserPatterns: Record<BrowserType, string[]> = {
        chrome: ['chrome-mv3', 'chrome'],
        edge: ['chrome-mv3', 'chrome'], // Edge utilise les extensions Chrome
        firefox: ['firefox-mv2', 'firefox'],
        safari: ['safari-mv2', 'safari'],
        unknown: [],
    }

    const patterns = browserPatterns[browserType]

    for (const pattern of patterns) {
        const asset = assets.find(a => a.name.toLowerCase().includes(pattern))
        if (asset) return asset.browser_download_url
    }

    return null
}

async function fetchLatestRelease(): Promise<GitHubRelease | null> {
    // Vérifier le cache
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(CACHE_KEY)
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached)
                if (Date.now() - timestamp < CACHE_DURATION) {
                    return data
                }
            } catch {
                // Cache invalide, on continue
            }
        }
    }

    try {
        const response = await fetch(`https://api.github.com/repos/${GITHUB_REPO}/releases/latest`)
        if (!response.ok) return null

        const data = await response.json()

        // Mettre en cache
        if (typeof window !== 'undefined') {
            localStorage.setItem(CACHE_KEY, JSON.stringify({
                data,
                timestamp: Date.now()
            }))
        }

        return data
    } catch {
        return null
    }
}

export function Sidebar({ favorites, organizations, currentOrgId }: SidebarProps) {
    const pathname = usePathname()
    const { recents, removeRecent } = useAppStore()
    const [browserInfo, setBrowserInfo] = useState<BrowserInfo>({ type: 'unknown', displayName: 'navigateur' })
    const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
    const [isLoadingRelease, setIsLoadingRelease] = useState(true)
    const [validatedRecents, setValidatedRecents] = useState(recents)
    const hasValidated = useRef(false)

    useEffect(() => {
        const info = getBrowserInfo()
        setBrowserInfo(info)

        // Récupérer la dernière release
        fetchLatestRelease().then((release) => {
            if (release) {
                const url = getExtensionDownloadUrl(release.assets, info.type)
                setDownloadUrl(url)
            }
            setIsLoadingRelease(false)
        })
    }, [])

    // Valider les récents au montage et nettoyer les éléments supprimés
    useEffect(() => {
        if (recents.length === 0 || hasValidated.current) return

        hasValidated.current = true

        validateRecents(recents).then((validated) => {
            // Supprimer les récents qui n'existent plus
            validated.forEach((v) => {
                if (!v.exists) {
                    removeRecent(v.type, v.id)
                }
            })

            // Mettre à jour avec les récents valides (avec organization_id)
            setValidatedRecents(
                validated
                    .filter((v) => v.exists)
                    .map((v) => ({
                        type: v.type,
                        id: v.id,
                        name: v.name,
                        timestamp: v.timestamp,
                        organizationId: v.organizationId,
                    }))
            )
        })
    }, [recents, removeRecent])

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
                    {navigation
                        .filter(item => !item.requiresOrg || currentOrgId)
                        .map((item) => {
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
                                <SidebarResourceLink
                                    key={fav.id}
                                    type="favorite"
                                    resourceType={fav.resource_type}
                                    resourceId={fav.resource_id}
                                    resourceName={fav.resource_name}
                                    organizationId={fav.organization_id}
                                    organizations={organizations}
                                />
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
                    {validatedRecents.length === 0 ? (
                        <p className="px-3 py-2 text-xs text-muted-foreground">
                            Aucun élément récent
                        </p>
                    ) : (
                        <div className="space-y-1">
                            {validatedRecents.map((recent) => (
                                <SidebarResourceLink
                                    key={`${recent.type}-${recent.id}`}
                                    type="recent"
                                    resourceType={recent.type}
                                    resourceId={recent.id}
                                    resourceName={recent.name}
                                    organizationId={recent.organizationId || null}
                                    organizations={organizations}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>

            {/* Extension Download */}
            <div className="border-t p-3">
                {isLoadingRelease ? (
                    <div className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Chargement...</span>
                    </div>
                ) : downloadUrl ? (
                    <a
                        href={downloadUrl}
                        download
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Download className="h-4 w-4" />
                        <div className="flex flex-col">
                            <span className="font-medium">Extension {browserInfo.displayName}</span>
                            <span className="text-xs">Télécharger l&apos;extension</span>
                        </div>
                    </a>
                ) : (
                    <a
                        href={`https://github.com/${GITHUB_REPO}/releases/latest`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                        <Download className="h-4 w-4" />
                        <div className="flex flex-col">
                            <span className="font-medium">Extension {browserInfo.displayName}</span>
                            <span className="text-xs">Voir les téléchargements</span>
                        </div>
                    </a>
                )}
            </div>
        </div>
    )
}
