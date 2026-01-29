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

interface DashboardShellProps {
    children: React.ReactNode
    favorites: Favorite[]
    organizations: Organization[]
    currentOrgId?: string
}

export function DashboardShell({ children, favorites, organizations, currentOrgId }: DashboardShellProps) {
    const [searchOpen, setSearchOpen] = useState(false)
    const { sidebarOpen, setSidebarOpen } = useAppStore()

    // Show modal if we have organizations but no currentOrgId selected
    const showOrgSelection = !currentOrgId && organizations.length > 0

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <DashboardInitializer />

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
