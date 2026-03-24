import { getAllSecrets, getAllUserSecrets } from '@/lib/actions/secrets'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { getFolders, getAllUserFolders } from '@/lib/actions/folders'
import { getClients, getAllUserClients } from '@/lib/actions/clients'
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
        // Mode "Tous mes secrets" : secrets personnels + orgs, dossiers personnels + orgs, clients des orgs
        const [secrets, folders, clients] = await Promise.all([
            getAllUserSecrets(),
            getAllUserFolders(),
            getAllUserClients()
        ])

        return (
            <SecretsPageContent
                secrets={secrets}
                folders={folders}
                clients={clients}
                organizationId={null}
                role="admin"
            />
        )
    }
}
