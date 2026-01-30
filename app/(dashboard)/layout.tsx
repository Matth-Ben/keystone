import { getFavorites } from '@/lib/actions/favorites'
import { getUserOrganizations } from '@/lib/actions/organizations'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { DashboardShell } from '@/components/dashboard/dashboard-shell'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Parallel fetching pour perf max
    const [rawFavorites, organizations, currentOrgId] = await Promise.all([
        getFavorites(),
        getUserOrganizations(),
        getOrganizationCookie(),
    ])

    if (organizations.length === 0) {
        redirect('/onboarding')
    }

    // Validation du cookie : est-ce que l'ID stocké correspond à une org de l'utilisateur ?
    // NOTE: La validation est faite côté client dans DashboardShell pour éviter les boucles de redirection serveur
    const isOrgValid = !currentOrgId || organizations.some(org => org.id === currentOrgId)

    // Convertir les favoris au format du store/interface de la sidebar
    const favorites = rawFavorites.map(f => ({
        id: f.id,
        resource_type: f.resource_type as 'client' | 'project',
        resource_id: f.resource_id,
        resource_name: f.resource_name,
    }))

    return (
        <DashboardShell
            favorites={favorites}
            organizations={organizations}
            currentOrgId={currentOrgId}
        >
            {children}
        </DashboardShell>
    )
}
