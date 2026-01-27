'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez vos préférences personnelles
                </p>
            </div>

            <div className="rounded-lg border bg-card p-8 text-center">
                <p className="text-muted-foreground">
                    Paramètres de profil utilisateur à venir.
                </p>
            </div>
        </div>
    )
}
