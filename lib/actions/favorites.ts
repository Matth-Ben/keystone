'use server'

import { createClient } from '@/lib/supabase/server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function getFavorites() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const { data: favorites, error } = await supabase
        .from('favorites')
        .select(`
            id,
            resource_type,
            resource_id
        `)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching favorites:', error)
        throw new Error('Erreur lors de la récupération des favoris')
    }

    // Utiliser le client admin pour récupérer les noms (contourner RLS)
    const adminClient = createAdminClient()

    // Pour chaque favori, récupérer le nom et l'organization_id de la ressource
    // Filtrer les ressources supprimées
    const favoritesWithDetails = await Promise.all(
        favorites.map(async (fav: any) => {
            let resourceName = 'Unknown'
            let organizationId: string | null = null
            let exists = false

            if (fav.resource_type === 'client') {
                const { data: client } = await adminClient
                    .from('clients')
                    .select('name, organization_id, deleted_at')
                    .eq('id', fav.resource_id)
                    .single()

                if (client && !client.deleted_at) {
                    resourceName = client.name
                    organizationId = client.organization_id
                    exists = true
                }
            } else if (fav.resource_type === 'project') {
                const { data: project } = await adminClient
                    .from('projects')
                    .select('name, organization_id, deleted_at')
                    .eq('id', fav.resource_id)
                    .single()

                if (project && !project.deleted_at) {
                    resourceName = project.name
                    organizationId = project.organization_id
                    exists = true
                }
            }

            if (!exists) {
                // Supprimer automatiquement les favoris orphelins
                await supabase.from('favorites').delete().eq('id', fav.id)
                return null
            }

            return {
                id: fav.id,
                resource_type: fav.resource_type,
                resource_id: fav.resource_id,
                resource_name: resourceName,
                organization_id: organizationId,
            }
        })
    )

    // Filtrer les null (favoris supprimés)
    return favoritesWithDetails.filter((f): f is NonNullable<typeof f> => f !== null)
}

export async function toggleFavorite(
    resourceType: 'client' | 'project',
    resourceId: string
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Vérifier si le favori existe déjà
    const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('resource_type', resourceType)
        .eq('resource_id', resourceId)
        .single()

    if (existing) {
        // Retirer le favori
        const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('id', (existing as any).id)

        if (error) {
            console.error('Error removing favorite:', error)
            throw new Error('Erreur lors de la suppression du favori')
        }

        return { action: 'removed', id: (existing as any).id }
    } else {
        // Ajouter le favori
        const { data: newFavorite, error } = await supabase
            .from('favorites')
            .insert({
                user_id: user.id,
                resource_type: resourceType,
                resource_id: resourceId,
            } as any)
            .select()
            .single()

        if (error) {
            console.error('Error adding favorite:', error)
            throw new Error('Erreur lors de l\'ajout du favori')
        }

        return { action: 'added', id: (newFavorite as any).id }
    }
}
