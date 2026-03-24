import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getClients, Client } from '@/lib/actions/clients'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { ClientsGrid } from '@/components/clients/clients-grid'
import { ClientSearch } from '@/components/clients/client-search'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateClientDialogWrapper } from '@/components/clients/create-client-dialog-wrapper'
import { requireOrgRole, type OrgRole } from '@/lib/rbac'
import { PermissionGate } from '@/components/ui/permission-gate'

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const organizationId = await getOrganizationCookie()

    // Cette page nécessite une organisation
    if (!organizationId) {
        redirect('/secrets')
    }

    const filters = await searchParams
    const query = (filters.q as string) || ''

    const [clients, membership] = await Promise.all([
        getClients(organizationId, query),
        requireOrgRole(organizationId),
    ])
    const role: OrgRole = membership.role

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">
                        Gérez vos clients
                    </p>
                </div>
                <PermissionGate role={role} require="write">
                    <CreateClientDialogWrapper />
                </PermissionGate>
            </div>

            <div className="relative">
                <ClientSearch />
            </div>

            <Suspense fallback={<ClientsSkeleton />}>
                <ClientsGrid
                    clients={clients}
                    searchQuery={query}
                    hasOrganization={true}
                />
            </Suspense>
        </div>
    )
}

function ClientsSkeleton() {
    return (
        <div className="flex flex-col gap-4">
            {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
        </div>
    )
}


