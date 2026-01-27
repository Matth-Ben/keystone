'use client'

import { Search } from 'lucide-react'
import { Client } from '@/lib/actions/clients'
import { ClientCard } from '@/components/clients/client-card'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'
import { useRouter } from 'next/navigation'

interface ClientsGridProps {
    clients: Client[]
    searchQuery: string
    hasOrganization: boolean
}

export function ClientsGrid({ clients, searchQuery, hasOrganization }: ClientsGridProps) {
    const router = useRouter()

    if (!hasOrganization) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <p className="text-muted-foreground">Veuillez sélectionner une organisation</p>
            </div>
        )
    }

    const refresh = () => router.refresh()

    if (clients.length === 0) {
        return (
            <div className="flex h-[40vh] flex-col items-center justify-center gap-4 rounded-lg border border-dashed text-center">
                <div className="rounded-full bg-muted p-4">
                    <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Aucun client trouvé</h3>
                    <p className="text-sm text-muted-foreground">
                        {searchQuery
                            ? "Essayez d'autres termes de recherche"
                            : "Commencez par ajouter votre premier client"}
                    </p>
                </div>
                {!searchQuery && <CreateClientDialog onClientCreated={refresh} />}
            </div>
        )
    }

    return (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {clients.map((client) => (
                <ClientCard key={client.id} client={client} />
            ))}
        </div>
    )
}
