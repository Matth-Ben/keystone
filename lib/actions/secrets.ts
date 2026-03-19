'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/vault'
import { revalidatePath } from 'next/cache'
import { requireOrgRole, assertCanWrite, assertCanDelete, assertCanRevealSecrets } from '@/lib/rbac'

export type SecretType = 'ssh' | 'ftp' | 'db' | 'cms' | 'api' | 'other'

export interface Secret {
    id: string
    client_id: string
    type: SecretType
    title: string
    username?: string | null
    host?: string | null
    port?: number | null
    url?: string | null
    db_name?: string | null
    tags?: string[] | null
    notes?: string | null
    created_at: string
    updated_at: string
}

// Schéma pour la création/édition
export interface SecretFormData {
    client_id: string
    type: SecretType
    title: string
    password?: string // Optionnel en édition
    username?: string
    host?: string
    port?: number
    url?: string
    db_name?: string
    tags?: string[]
    notes?: string
}

export async function getAllSecrets(organizationId: string): Promise<(Secret & { clients: { name: string } | null })[]> {
    // 1. Vérification sécurité (tous les membres de l'org peuvent lire)
    await requireOrgRole(organizationId)

    // 2. Récupération données (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('secrets')
        .select(`
            *,
            clients!inner (
                id,
                name,
                organization_id
            )
        `)
        .eq('clients.organization_id', organizationId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching all secrets:', error)
        throw new Error('Erreur lors du chargement des secrets')
    }

    return data as (Secret & { clients: { name: string } | null })[]
}

export async function getSecrets(clientId: string): Promise<Secret[]> {
    // 1. Vérifier que l'utilisateur a accès à l'organisation du client
    const orgId = await getOrgIdFromClient(clientId)
    await requireOrgRole(orgId)

    // 2. Récupération données (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('secrets')
        .select('id, client_id, type, title, username, host, port, url, db_name, tags, notes, created_at, updated_at')
        .eq('client_id', clientId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching secrets:', error)
        throw new Error('Erreur lors du chargement des secrets')
    }

    return data as Secret[]
}

export async function getSecretDetails(secretId: string): Promise<Secret> {
    // 1. Vérifier que l'utilisateur a accès à l'organisation du secret
    const orgId = await getOrgIdFromSecret(secretId)
    await requireOrgRole(orgId)

    // 2. Récupération données (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('secrets')
        .select('*')
        .eq('id', secretId)
        .single()

    if (error || !data) {
        throw new Error('Secret introuvable')
    }

    return data as Secret
}

async function getOrgIdFromClient(clientId: string): Promise<string> {
    const adminClient = createAdminClient() as any
    const { data, error } = await adminClient
        .from('clients')
        .select('organization_id')
        .eq('id', clientId)
        .single()
    if (error || !data) throw new Error('Client introuvable')
    return data.organization_id
}

async function getOrgIdFromSecret(secretId: string): Promise<string> {
    const adminClient = createAdminClient() as any
    const { data, error } = await adminClient
        .from('secrets')
        .select('client_id, clients!inner(organization_id)')
        .eq('id', secretId)
        .single()
    if (error || !data) throw new Error('Secret introuvable')
    return (data.clients as any).organization_id
}

export async function createSecret(data: SecretFormData) {
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')
    if (!data.password) throw new Error('Le mot de passe/clé est requis')

    // 2. Vérification du rôle
    const orgId = await getOrgIdFromClient(data.client_id)
    const { role } = await requireOrgRole(orgId)
    assertCanWrite(role)

    // 3. Création (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any
    const encrypted_password = encrypt(data.password)

    const { error } = await adminClient
        .from('secrets')
        .insert({
            client_id: data.client_id,
            type: data.type,
            title: data.title,
            encrypted_password,
            username: data.username,
            host: data.host,
            port: data.port,
            url: data.url,
            db_name: data.db_name,
            tags: data.tags,
            notes: data.notes,
            created_by: user.id
        })

    if (error) {
        console.error('Error creating secret:', error)
        throw new Error('Erreur lors de la création du secret')
    }

    revalidatePath(`/clients/${data.client_id}`)
    revalidatePath('/secrets')
}

export async function revealSecret(secretId: string): Promise<string> {
    // 1. Vérification du rôle (les Lecteurs ne peuvent pas révéler)
    const orgId = await getOrgIdFromSecret(secretId)
    const { role } = await requireOrgRole(orgId)
    assertCanRevealSecrets(role)

    // TODO: Ajouter un log d'audit ici ("User X revealed Secret Y")

    // 2. Récupération données (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('secrets')
        .select('encrypted_password')
        .eq('id', secretId)
        .single()

    if (error || !data) {
        throw new Error('Secret introuvable')
    }

    try {
        return decrypt(data.encrypted_password)
    } catch (e) {
        console.error('Decryption failed:', e)
        throw new Error('Erreur de déchiffrement')
    }
}

export async function deleteSecret(secretId: string, clientId: string) {
    // 1. Vérification du rôle (admin seulement)
    const orgId = await getOrgIdFromClient(clientId)
    const { role } = await requireOrgRole(orgId)
    assertCanDelete(role)

    // 2. Soft delete (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { error } = await adminClient
        .from('secrets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', secretId)

    if (error) {
        throw new Error('Erreur lors de la suppression')
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath('/secrets')
}

export async function updateSecret(secretId: string, clientId: string, data: Partial<SecretFormData>) {
    // 1. Vérification du rôle
    const orgId = await getOrgIdFromClient(clientId)
    const { role } = await requireOrgRole(orgId)
    assertCanWrite(role)

    // 2. Mise à jour (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const updateData: any = {
        title: data.title,
        type: data.type,
        username: data.username,
        host: data.host,
        port: data.port,
        url: data.url,
        db_name: data.db_name,
        tags: data.tags,
        notes: data.notes,
        updated_at: new Date().toISOString()
    }

    // Si un nouveau mot de passe est fourni, on le chiffre
    if (data.password) {
        updateData.encrypted_password = encrypt(data.password)
    }

    const { error } = await adminClient
        .from('secrets')
        .update(updateData)
        .eq('id', secretId)

    if (error) {
        console.error('Error updating secret:', error)
        throw new Error('Erreur lors de la modification')
    }

    revalidatePath(`/clients/${clientId}`)
    revalidatePath('/secrets')
}
