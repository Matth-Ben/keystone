'use server'

import { createClient } from '@/lib/supabase/server'

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

    // Pour chaque favori, récupérer le nom de la ressource
    const favoritesWithNames = await Promise.all(
        favorites.map(async (fav) => {
            let resourceName = 'Unknown'

            if (fav.resource_type === 'client') {
                const { data: client } = await supabase
                    .from('clients')
                    .select('name')
                    .eq('id', fav.resource_id)
                    .single()
                resourceName = client?.name || 'Unknown'
            } else if (fav.resource_type === 'project') {
                const { data: project } = await supabase
                    .from('projects')
                    .select('name')
                    .eq('id', fav.resource_id)
                    .single()
                resourceName = project?.name || 'Unknown'
            }

            return {
                id: fav.id,
                resource_type: fav.resource_type,
                resource_id: fav.resource_id,
                resource_name: resourceName,
            }
        })
    )

    return favoritesWithNames
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
            .eq('id', existing.id)

        if (error) {
            console.error('Error removing favorite:', error)
            throw new Error('Erreur lors de la suppression du favori')
        }

        return { action: 'removed', id: existing.id }
    } else {
        // Ajouter le favori
        const { data: newFavorite, error } = await supabase
            .from('favorites')
            .insert({
                user_id: user.id,
                resource_type: resourceType,
                resource_id: resourceId,
            })
            .select()
            .single()

        if (error) {
            console.error('Error adding favorite:', error)
            throw new Error('Erreur lors de l\'ajout du favori')
        }

        return { action: 'added', id: newFavorite.id }
    }
}
