import { ReactNode } from 'react'
import { SettingsNav } from '@/components/settings/settings-nav'

interface SettingsLayoutProps {
    children: ReactNode
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez vos préférences et paramètres personnels
                </p>
            </div>

            <div className="flex flex-col gap-6 lg:flex-row">
                {/* Sidebar Navigation */}
                <aside className="lg:w-64 shrink-0">
                    <SettingsNav />
                </aside>

                {/* Content Area */}
                <main className="flex-1 min-w-0">
                    <div className="rounded-lg border bg-card p-6">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
