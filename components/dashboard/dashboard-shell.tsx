'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { useAppStore } from '@/lib/store/app-store'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { Favorite, Organization } from '@/lib/store/app-store'
import { DashboardInitializer } from '@/components/dashboard/dashboard-initializer'
import { OrganizationSelectionModal } from '@/components/dashboard/organization-selection-modal'
import { RemovalWatcher } from '@/components/organization/removal-watcher'

interface DashboardShellProps {
    children: React.ReactNode
    favorites: Favorite[]
    organizations: Organization[]
    currentOrgId?: string
}

export function DashboardShell({ children, favorites, organizations, currentOrgId }: DashboardShellProps) {
    const [searchOpen, setSearchOpen] = useState(false)
    const { sidebarOpen, setSidebarOpen } = useAppStore()

    // Ne plus forcer la sélection d'organisation - l'utilisateur peut utiliser
    // le mode "Tous mes secrets" sans organisation sélectionnée
    const showOrgSelection = false

    // Validation du cookie côté client
    const { setCurrentOrganization } = useAppStore()

    // Si l'ID courant n'est pas dans la liste des organisations valides, on passe en mode personnel
    if (currentOrgId && organizations.length > 0) {
        const isValid = organizations.some(o => o.id === currentOrgId)
        if (!isValid) {
            console.warn('Invalid Organization ID detected, switching to personal mode...')
            // On passe en mode "Tous mes secrets" (pas d'org)
            import('@/lib/actions/organization-cookie')
                .then(mod => mod.clearOrganizationCookie())
                .then(() => {
                    // Force a hard reload to ensure server components re-render with new cookie
                    window.location.reload()
                })

            // On ne rend rien ou un loader en attendant le reload
            return <div className="flex h-screen items-center justify-center">Redirection...</div>
        }
    }

    const currentOrg = organizations.find(o => o.id === currentOrgId)

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <DashboardInitializer />

            {currentOrgId && currentOrg && (
                <RemovalWatcher
                    organizationId={currentOrgId}
                    organizationName={currentOrg.name}
                />
            )}

            <OrganizationSelectionModal
                organizations={organizations}
                isOpen={showOrgSelection}
            />

            {/* Desktop Sidebar */}
            <aside className="hidden md:block">
                <Sidebar favorites={favorites} organizations={organizations} currentOrgId={currentOrgId} />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <SheetTitle className="sr-only">Menu de navigation</SheetTitle>
                    <Sidebar favorites={favorites} organizations={organizations} currentOrgId={currentOrgId} />
                </SheetContent>
            </Sheet>

            {/* Main content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                <Topbar onOpenSearch={() => setSearchOpen(true)} />

                <main className="flex-1 overflow-y-auto p-6">
                    {children}
                </main>
            </div>

            {/* Global Search */}
            <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
        </div>
    )
}
