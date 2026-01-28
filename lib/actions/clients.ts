'use server'

import { createClient as createSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export interface Client {
    id: string
    name: string
    website: string | null
    description: string | null
    organization_id: string
    logo: string | null
    links?: { label: string; url: string }[] | null
    created_at: string
}

async function checkOrganizationAccess(organizationId: string) {
    const supabase = await createSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Vérifier l'appartenance via la politique "view_own_membership" (RLS standard)
    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership) {
        throw new Error('Accès refusé à cette organisation')
    }

    return user
}

export async function getClients(organizationId: string, query?: string) {
    // 1. Vérification sécurité
    await checkOrganizationAccess(organizationId)

    // 2. Récupération données (Admin Client pour contourner RLS complexes sur clients)
    const adminClient = createAdminClient()

    let dbQuery = adminClient
        .from('clients')
        .select('*')
        .eq('organization_id', organizationId)
        .order('name', { ascending: true })

    if (query) {
        dbQuery = dbQuery.ilike('name', `%${query}%`)
    }

    const { data: clients, error } = await dbQuery

    if (error) {
        console.error('Error fetching clients:', error)
        throw new Error('Erreur lors de la récupération des clients')
    }

    return clients as Client[]
}

export async function getClient(clientId: string) {
    const adminClient = createAdminClient()

    // On récupère d'abord le client pour connaître son organisation
    const { data: client, error } = await adminClient
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single()

    if (error || !client) {
        throw new Error('Client non trouvé')
    }

    // On vérifie l'accès à l'organisation du client
    await checkOrganizationAccess(client.organization_id)

    return client as Client
}

export async function createClient(data: {
    name: string
    website?: string
    description?: string
    organizationId: string
}) {
    // 1. Vérification sécurité
    await checkOrganizationAccess(data.organizationId)

    // 2. Création (Admin Client)
    const adminClient = createAdminClient() as any

    const { data: newClient, error } = await adminClient
        .from('clients')
        .insert({
            name: data.name,
            website: data.website,
            description: data.description,
            organization_id: data.organizationId,
        } as any)
        .select()
        .single()

    if (error) {
        console.error('Error creating client:', error)
        throw new Error('Erreur lors de la création du client')
    }

    revalidatePath('/clients')
    return newClient as Client
}

export async function updateClient(clientId: string, data: {
    name?: string
    website?: string
    description?: string
    links?: { label: string; url: string }[]
}) {
    // 1. Récupérer le client pour vérifier l'org
    const currentClient = await getClient(clientId) // Vérifie déjà l'accès

    // 2. Mise à jour
    const adminClient = createAdminClient() as any

    const { error } = await adminClient
        .from('clients')
        .update({
            name: data.name,
            website: data.website,
            description: data.description,
            links: data.links,
        } as any)
        .eq('id', clientId)

    if (error) {
        console.error('Error updating client:', error)
        throw new Error('Erreur lors de la mise à jour du client')
    }

    revalidatePath('/clients')
    revalidatePath(`/clients/${clientId}`)
    return { success: true }
}

export async function deleteClient(clientId: string) {
    // 1. Récupérer le client pour vérifier l'org
    const currentClient = await getClient(clientId)

    // 2. Suppression
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('clients')
        .delete()
        .eq('id', clientId)

    if (error) {
        console.error('Error deleting client:', error)
        throw new Error('Erreur lors de la suppression du client')
    }

    revalidatePath('/clients')
    return { success: true }
}
