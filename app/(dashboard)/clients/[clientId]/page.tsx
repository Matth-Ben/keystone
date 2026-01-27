import Link from 'next/link'
import { ArrowLeft, MoreHorizontal, Edit, Trash2 } from 'lucide-react'
import { getClient } from '@/lib/actions/clients'
import { getSecrets } from '@/lib/actions/secrets'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ClientActions } from '@/components/clients/client-actions'
import { RecentTracker } from '@/components/dashboard/recent-tracker'
import { Globe } from 'lucide-react'
import { SecretList } from '@/components/secrets/secret-list'
import { notFound } from 'next/navigation'

interface PageProps {
    params: Promise<{
        clientId: string
    }>
}

export default async function ClientPage({ params }: PageProps) {
    const resolvedParams = await params

    // Parallel fetching
    const [client, secrets] = await Promise.all([
        getClient(resolvedParams.clientId).catch(() => null),
        getSecrets(resolvedParams.clientId).catch(() => [])
    ])

    if (!client) {
        notFound()
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Link href="/clients" className="hover:text-foreground">
                            Clients
                        </Link>
                        <span>/</span>
                        <span className="text-foreground">{client.name}</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-primary/10 text-3xl font-bold text-primary overflow-hidden">
                            {client.logo ? (
                                <img src={client.logo} alt={client.name} className="h-full w-full object-cover" />
                            ) : client.website ? (
                                <img
                                    src={`https://www.google.com/s2/favicons?domain=${client.website}&sz=64`}
                                    alt={client.name}
                                    className="h-10 w-10 object-contain"
                                />
                            ) : (
                                client.name.charAt(0).toUpperCase()
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">{client.name}</h1>
                            {client.website && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Globe className="h-3 w-3" />
                                    <a href={client.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                                        {client.website}
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <RecentTracker type="client" id={client.id} name={client.name} />
                    <ClientActions client={client} />
                </div>
            </div>

            {/* Description */}
            {client.description && (
                <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">
                    {client.description}
                </div>
            )}

            {/* Tabs */}
            <Tabs defaultValue="secrets" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="secrets">Secrets</TabsTrigger>
                    <TabsTrigger value="settings">Paramètres</TabsTrigger>
                </TabsList>

                <TabsContent value="secrets">
                    <SecretList secrets={secrets} clientId={client.id} />
                </TabsContent>

                <TabsContent value="settings">
                    <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
                        <p>Paramètres du client à venir</p>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
