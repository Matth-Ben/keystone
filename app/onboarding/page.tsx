'use client'

import { useState } from 'react'
import { Building2 } from 'lucide-react'
import { CreateOrganizationDialog } from '@/components/dashboard/create-organization-dialog'

export default function OnboardingPage() {
    const [dialogOpen, setDialogOpen] = useState(false)

    return (
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 p-4">
            <div className="w-full max-w-md space-y-8 text-center">
                {/* Logo */}
                <div className="flex justify-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
                        <span className="text-3xl font-bold">K</span>
                    </div>
                </div>

                {/* Titre */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">
                        Bienvenue sur Keystone ! 👋
                    </h1>
                    <p className="text-muted-foreground">
                        Pour commencer, créez votre première organisation
                    </p>
                </div>

                {/* Card */}
                <div className="rounded-lg border bg-card p-8 text-left space-y-4">
                    <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Building2 className="h-6 w-6" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <h3 className="font-semibold">Qu'est-ce qu'une organisation ?</h3>
                            <p className="text-sm text-muted-foreground">
                                Une organisation représente votre entreprise ou équipe. Elle vous permet de gérer vos clients, projets et accès en un seul endroit.
                            </p>
                        </div>
                    </div>

                    <div className="pt-4">
                        <button
                            onClick={() => setDialogOpen(true)}
                            className="w-full rounded-lg bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                        >
                            Créer mon organisation
                        </button>
                    </div>
                </div>

                {/* Info */}
                <p className="text-xs text-muted-foreground">
                    Vous pourrez inviter des membres et gérer les permissions plus tard
                </p>
            </div>

            <CreateOrganizationDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
            />
        </div>
    )
}
