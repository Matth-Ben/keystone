'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireOrgRole, assertCanWrite, assertCanDelete } from '@/lib/rbac'

export interface Client {
    id: string
    name: string
    website: string | null
    description: string | null
    organization_id: string
    logo: string | null
    links?: { label: string; url: string }[] | null
    drive_folder_url?: string | null
    created_at: string
}

export async function getClients(organizationId: string, query?: string) {
    // 1. Vérification sécurité (tous les rôles peuvent lire)
    await requireOrgRole(organizationId)

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

    // On vérifie l'accès à l'organisation du client (tous les rôles peuvent lire)
    await requireOrgRole(client.organization_id)

    return client as Client
}

export async function createClient(data: {
    name: string
    website?: string
    description?: string
    organizationId: string
}) {
    // 1. Vérification sécurité + permission écriture
    const { role } = await requireOrgRole(data.organizationId)
    assertCanWrite(role)

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
    drive_folder_url?: string
}) {
    // 1. Récupérer le client pour connaître l'org, puis vérifier le rôle
    const currentClient = await getClient(clientId)
    const { role } = await requireOrgRole(currentClient.organization_id)
    assertCanWrite(role)

    // 2. Mise à jour
    const adminClient = createAdminClient() as any

    const { error } = await adminClient
        .from('clients')
        .update({
            name: data.name,
            website: data.website,
            description: data.description,
            links: data.links,
            drive_folder_url: data.drive_folder_url,
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
    // 1. Récupérer le client pour connaître l'org, puis vérifier le rôle admin
    const currentClient = await getClient(clientId)
    const { role } = await requireOrgRole(currentClient.organization_id)
    assertCanDelete(role)

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
