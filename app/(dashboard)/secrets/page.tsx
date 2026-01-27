import { Suspense } from 'react'
import { getAllSecrets } from '@/lib/actions/secrets'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { SecretList } from '@/components/secrets/secret-list'
import { Skeleton } from '@/components/ui/skeleton'

export const metadata = {
    title: 'Tous les Secrets',
}

export default async function SecretsPage() {
    const organizationId = await getOrganizationCookie()
    let secrets: any[] = []

    if (organizationId) {
        secrets = await getAllSecrets(organizationId)
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Tous les secrets</h1>
                <p className="text-muted-foreground">
                    Accédez à l'ensemble des secrets de vos clients en un seul endroit.
                </p>
            </div>

            <Suspense fallback={<div className="space-y-4">
                <Skeleton className="h-10 w-full md:w-1/3" />
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
            </div>}>
                <SecretList secrets={secrets} />
            </Suspense>
        </div>
    )
}
