import { Suspense } from 'react'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { getOrganization } from '@/lib/actions/organizations'
import { OrganizationView } from '@/components/organization/organization-view'
import { Skeleton } from '@/components/ui/skeleton'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Organisation',
}

export default async function OrganizationPage() {
    const organizationId = await getOrganizationCookie()

    if (!organizationId) {
        // Rediriger vers onboarding ou home si pas d'org sélectionnée
        redirect('/')
    }

    try {
        const organization = await getOrganization(organizationId)

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organisation</h1>
                    <p className="text-muted-foreground">
                        Gérez les paramètres de l'organisation et ses membres
                    </p>
                </div>

                <Suspense fallback={<Skeleton className="h-[400px] w-full" />}>
                    <OrganizationView organization={organization} />
                </Suspense>
            </div>
        )
    } catch (error) {
        // Si organisation introuvable (ex: supprimée, cookie obsolète)
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-semibold">Organisation introuvable</h3>
                <p className="text-muted-foreground">Impossible de charger les détails de l'organisation.</p>
            </div>
        )
    }
}
