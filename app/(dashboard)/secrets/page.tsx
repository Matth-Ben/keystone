import { Suspense } from 'react'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { SecretsLoader } from '@/components/secrets/secrets-loader'
import { SecretsSkeleton } from '@/components/secrets/secrets-skeleton'

export const metadata = {
    title: 'Tous les Secrets',
}

export default async function SecretsPage() {
    // Récupérer uniquement l'ID pour le header (très rapide)
    const organizationId = await getOrganizationCookie()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">
                    {organizationId ? 'Tous les secrets' : 'Mes secrets'}
                </h1>
                <p className="text-muted-foreground">
                    {organizationId
                        ? 'Organisez et accédez à vos secrets par dossiers et clients.'
                        : 'Vos secrets personnels et ceux de vos organisations.'}
                </p>
            </div>

            <Suspense fallback={<SecretsSkeleton />}>
                <SecretsLoader />
            </Suspense>
        </div>
    )
}
