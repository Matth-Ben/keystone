'use client'

import { useState } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Topbar } from '@/components/dashboard/topbar'
import { GlobalSearch } from '@/components/dashboard/global-search'
import { useAppStore } from '@/lib/store/app-store'
import { Sheet, SheetContent } from '@/components/ui/sheet'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [searchOpen, setSearchOpen] = useState(false)
    const { sidebarOpen, setSidebarOpen } = useAppStore()

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Desktop Sidebar */}
            <aside className="hidden md:block">
                <Sidebar />
            </aside>

            {/* Mobile Sidebar */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                <SheetContent side="left" className="w-64 p-0">
                    <Sidebar />
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
