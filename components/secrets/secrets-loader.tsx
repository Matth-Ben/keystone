import { getAllSecrets, getAllUserSecrets } from '@/lib/actions/secrets'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { getFolders, getPersonalFolders } from '@/lib/actions/folders'
import { getClients } from '@/lib/actions/clients'
import { SecretsPageContent } from '@/components/secrets/secrets-page-content'

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
        // Mode personnel : secrets personnels + dossiers personnels
        const [secrets, folders] = await Promise.all([
            getAllUserSecrets(),
            getPersonalFolders()
        ])

        return (
            <SecretsPageContent
                secrets={secrets}
                folders={folders}
                clients={[]}
                organizationId={null}
                role="admin"
            />
        )
    }
}
