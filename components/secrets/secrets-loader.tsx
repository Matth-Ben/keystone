import { getAllSecrets, getAllUserSecrets } from '@/lib/actions/secrets'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { getFolders } from '@/lib/actions/folders'
import { getClients } from '@/lib/actions/clients'
import { SecretList } from '@/components/secrets/secret-list'
import { SecretsPageContent } from '@/components/secrets/secrets-page-content'
import { type OrgRole } from '@/lib/rbac'

export async function SecretsLoader() {
    const organizationId = await getOrganizationCookie()

    if (organizationId) {
        // Mode organisation : charger secrets, dossiers et clients en parallèle
        const [secretsResult, foldersResult, clientsResult] = await Promise.all([
            getAllSecrets(organizationId),
            getFolders(organizationId),
            getClients(organizationId)
        ])

        return (
            <SecretsPageContent
                secrets={secretsResult.secrets}
                folders={foldersResult}
                clients={clientsResult}
                organizationId={organizationId}
                role={secretsResult.role}
            />
        )
    } else {
        // Mode personnel : pas de dossiers, affichage simple
        const secrets = await getAllUserSecrets()
        return <SecretList secrets={secrets} role="admin" />
    }
}
