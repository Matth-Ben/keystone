import { Suspense } from 'react'
import { getClients, Client } from '@/lib/actions/clients'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { ClientsGrid } from '@/components/clients/clients-grid'
import { ClientSearch } from '@/components/clients/client-search'
import { Skeleton } from '@/components/ui/skeleton'
import { CreateClientDialogWrapper } from '@/components/clients/create-client-dialog-wrapper'

export default async function ClientsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const filters = await searchParams
    const query = (filters.q as string) || ''
    const organizationId = await getOrganizationCookie()

    let clients: Client[] = []
    if (organizationId) {
        clients = await getClients(organizationId, query)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                    <p className="text-muted-foreground">
                        Gérez vos clients
                    </p>
                </div>
                <CreateClientDialogWrapper />
            </div>

            <div className="relative">
                <ClientSearch />
            </div>

            <Suspense fallback={<ClientsSkeleton />}>
                <ClientsGrid
                    clients={clients}
                    searchQuery={query}
                    hasOrganization={!!organizationId}
                />
            </Suspense>
        </div>
    )
}

function ClientsSkeleton() {
    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-[200px] w-full rounded-xl" />
            ))}
        </div>
    )
}


