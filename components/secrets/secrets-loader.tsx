import { getAllSecrets, getAllUserSecrets } from '@/lib/actions/secrets'
import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { SecretList } from '@/components/secrets/secret-list'
import { type OrgRole } from '@/lib/rbac'

export async function SecretsLoader() {
    const organizationId = await getOrganizationCookie()
    let secrets: any[] = []
    let role: OrgRole = 'admin' // Mode personnel = contrôle total

    if (organizationId) {
        // Mode organisation : getAllSecrets retourne secrets + role en une seule opération
        const result = await getAllSecrets(organizationId)
        secrets = result.secrets
        role = result.role
    } else {
        // Mode personnel : tous les secrets de l'utilisateur
        secrets = await getAllUserSecrets()
        role = 'admin' // Contrôle total sur ses secrets personnels
    }

    return <SecretList secrets={secrets} role={role} />
}
