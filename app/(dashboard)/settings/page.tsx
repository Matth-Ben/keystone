'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MembersTab } from '@/components/settings/members-tab'

export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
                <p className="text-muted-foreground">
                    Gérez votre organisation et ses membres
                </p>
            </div>

            <Tabs defaultValue="members" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="members">Membres</TabsTrigger>
                    <TabsTrigger value="organization">Organisation</TabsTrigger>
                </TabsList>

                <TabsContent value="members" className="space-y-4">
                    <MembersTab />
                </TabsContent>

                <TabsContent value="organization" className="space-y-4">
                    <div className="rounded-lg border bg-card p-8 text-center">
                        <p className="text-muted-foreground">
                            Les paramètres d'organisation seront ajoutés prochainement.
                        </p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
