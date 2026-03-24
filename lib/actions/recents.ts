'use server'

import { createAdminClient } from '@/lib/supabase/admin'

interface RecentItem {
    type: 'client' | 'project'
    id: string
    name: string
    timestamp: number
    organizationId?: string | null
}

interface ValidatedRecent extends RecentItem {
    exists: boolean
    organizationId: string | null
}

// Valide les récents et retourne ceux qui existent encore avec leur organization_id
export async function validateRecents(recents: RecentItem[]): Promise<ValidatedRecent[]> {
    if (recents.length === 0) return []

    const adminClient = createAdminClient()

    const validated = await Promise.all(
        recents.map(async (recent): Promise<ValidatedRecent> => {
            if (recent.type === 'client') {
                const { data: client } = await adminClient
                    .from('clients')
                    .select('id, name, organization_id, deleted_at')
                    .eq('id', recent.id)
                    .single()

                if (client && !client.deleted_at) {
                    return {
                        ...recent,
                        name: client.name, // Mettre à jour le nom au cas où il a changé
                        exists: true,
                        organizationId: client.organization_id,
                    }
                }
            } else if (recent.type === 'project') {
                const { data: project } = await adminClient
                    .from('projects')
                    .select('id, name, organization_id, deleted_at')
                    .eq('id', recent.id)
                    .single()

                if (project && !project.deleted_at) {
                    return {
                        ...recent,
                        name: project.name,
                        exists: true,
                        organizationId: project.organization_id,
                    }
                }
            }

            return {
                ...recent,
                exists: false,
                organizationId: null,
            }
        })
    )

    return validated
}
