'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { encrypt, decrypt } from '@/lib/vault'
import { revalidatePath } from 'next/cache'
import { requireOrgRole, assertCanWrite, assertCanDelete, assertCanRevealSecrets } from '@/lib/rbac'

export type SecretType = 'ssh' | 'ftp' | 'db' | 'cms' | 'api' | 'other'

export interface Secret {
    id: string
    organization_id: string | null
    client_id: string | null
    folder_id: string | null
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
    created_by?: string
}

// Schéma pour la création/édition
export interface SecretFormData {
    organization_id?: string | null
    client_id?: string | null
    folder_id?: string | null
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

// Colonnes nécessaires pour l'affichage et l'édition des secrets
const SECRET_LIST_COLUMNS = `
    id,
    organization_id,
    client_id,
    folder_id,
    type,
    title,
    username,
    host,
    port,
    url,
    db_name,
    notes,
    created_at,
    clients (
        id,
        name
    )
`

export async function getAllSecrets(organizationId: string): Promise<{
    secrets: (Secret & { clients: { name: string } | null })[]
    role: import('@/lib/rbac').OrgRole
}> {
    const adminClient = createAdminClient() as any

    // Paralléliser : vérification du rôle + récupération des secrets
    const [membership, secretsResult] = await Promise.all([
        requireOrgRole(organizationId),
        adminClient
            .from('secrets')
            .select(SECRET_LIST_COLUMNS)
            .eq('organization_id', organizationId)
            .is('deleted_at', null)
            .order('created_at', { ascending: false })
    ])

    if (secretsResult.error) {
        console.error('Error fetching all secrets:', secretsResult.error)
        throw new Error('Erreur lors du chargement des secrets')
    }

    return {
        secrets: secretsResult.data as (Secret & { clients: { name: string } | null })[],
        role: membership.role
    }
}

// Récupérer tous les secrets de l'utilisateur (personnels + organisations)
export async function getAllUserSecrets(): Promise<(Secret & { clients: { name: string } | null })[]> {
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    // 2. Récupérer les organisations de l'utilisateur
    const { data: memberships } = await adminClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)

    const orgIds = memberships?.map((m: { organization_id: string }) => m.organization_id) || []

    // 3. Paralléliser : secrets personnels + secrets des organisations
    const queries: Promise<any>[] = [
        // Secrets personnels
        adminClient
            .from('secrets')
            .select(SECRET_LIST_COLUMNS)
            .is('organization_id', null)
            .eq('created_by', user.id)
            .is('deleted_at', null)
    ]

    // Secrets des organisations (si l'utilisateur en a)
    if (orgIds.length > 0) {
        queries.push(
            adminClient
                .from('secrets')
                .select(SECRET_LIST_COLUMNS)
                .in('organization_id', orgIds)
                .is('deleted_at', null)
        )
    }

    const results = await Promise.all(queries)

    const personalResult = results[0]
    if (personalResult.error) {
        console.error('Error fetching personal secrets:', personalResult.error)
        throw new Error('Erreur lors du chargement des secrets personnels')
    }

    let orgSecrets: any[] = []
    if (results[1]) {
        if (results[1].error) {
            console.error('Error fetching org secrets:', results[1].error)
            throw new Error('Erreur lors du chargement des secrets')
        }
        orgSecrets = results[1].data || []
    }

    // 4. Combiner et trier par date de création
    const allSecrets = [...(personalResult.data || []), ...orgSecrets]
    allSecrets.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return allSecrets as (Secret & { clients: { name: string } | null })[]
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
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

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

    // 3. Vérification d'accès
    if (!data.organization_id) {
        // Secret personnel : vérifier que l'utilisateur est le créateur
        if (data.created_by !== user.id) {
            throw new Error('Accès non autorisé')
        }
    } else {
        // Secret d'organisation : vérifier l'appartenance
        await requireOrgRole(data.organization_id)
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

async function getOrgIdFromSecret(secretId: string): Promise<string | null> {
    const adminClient = createAdminClient() as any
    const { data, error } = await adminClient
        .from('secrets')
        .select('organization_id, created_by')
        .eq('id', secretId)
        .single()
    if (error || !data) throw new Error('Secret introuvable')
    return data.organization_id
}

// Vérifie si l'utilisateur peut accéder à un secret (personnel ou via organisation)
async function assertSecretAccess(secretId: string, userId: string): Promise<{ isPersonal: boolean; orgId: string | null }> {
    const adminClient = createAdminClient() as any
    const { data, error } = await adminClient
        .from('secrets')
        .select('organization_id, created_by')
        .eq('id', secretId)
        .single()

    if (error || !data) throw new Error('Secret introuvable')

    // Secret personnel : l'utilisateur doit être le créateur
    if (!data.organization_id) {
        if (data.created_by !== userId) {
            throw new Error('Accès non autorisé')
        }
        return { isPersonal: true, orgId: null }
    }

    // Secret d'organisation : vérification via requireOrgRole
    return { isPersonal: false, orgId: data.organization_id }
}

export async function createSecret(data: SecretFormData) {
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')
    if (!data.password) throw new Error('Le mot de passe/clé est requis')

    // 2. Vérification du rôle (seulement si organization_id est fourni)
    if (data.organization_id) {
        const { role } = await requireOrgRole(data.organization_id)
        assertCanWrite(role)
    }
    // Si pas d'organization_id, c'est un secret personnel - pas de vérification de rôle

    // 3. Création (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any
    const encrypted_password = encrypt(data.password)

    const { error } = await adminClient
        .from('secrets')
        .insert({
            organization_id: data.organization_id || null,
            client_id: data.client_id || null,
            folder_id: data.folder_id || null,
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

    if (data.client_id) {
        revalidatePath(`/clients/${data.client_id}`)
    }
    revalidatePath('/secrets')
}

export async function revealSecret(secretId: string): Promise<string> {
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // 2. Vérification d'accès
    const { isPersonal, orgId } = await assertSecretAccess(secretId, user.id)

    // Pour les secrets d'organisation, vérifier le rôle (les Lecteurs ne peuvent pas révéler)
    if (!isPersonal && orgId) {
        const { role } = await requireOrgRole(orgId)
        assertCanRevealSecrets(role)
    }
    // Pour les secrets personnels, l'utilisateur a le contrôle total

    // TODO: Ajouter un log d'audit ici ("User X revealed Secret Y")

    // 3. Récupération données (Admin Client pour contourner RLS)
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

export async function deleteSecret(secretId: string, clientId?: string | null) {
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // 2. Vérification d'accès
    const { isPersonal, orgId } = await assertSecretAccess(secretId, user.id)

    // Pour les secrets d'organisation, vérifier le rôle (admin seulement)
    if (!isPersonal && orgId) {
        const { role } = await requireOrgRole(orgId)
        assertCanDelete(role)
    }
    // Pour les secrets personnels, l'utilisateur a le contrôle total

    // 3. Soft delete (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { error } = await adminClient
        .from('secrets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', secretId)

    if (error) {
        throw new Error('Erreur lors de la suppression')
    }

    if (clientId) {
        revalidatePath(`/clients/${clientId}`)
    }
    revalidatePath('/secrets')
}

export async function updateSecret(secretId: string, data: Partial<SecretFormData>, clientId?: string | null) {
    // 1. Authentification
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // 2. Vérification d'accès
    const { isPersonal, orgId } = await assertSecretAccess(secretId, user.id)

    // Pour les secrets d'organisation, vérifier le rôle
    if (!isPersonal && orgId) {
        const { role } = await requireOrgRole(orgId)
        assertCanWrite(role)
    }
    // Pour les secrets personnels, l'utilisateur a le contrôle total

    // 3. Mise à jour (Admin Client pour contourner RLS)
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
        client_id: data.client_id === undefined ? undefined : (data.client_id || null),
        folder_id: data.folder_id === undefined ? undefined : (data.folder_id || null),
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

    if (clientId) {
        revalidatePath(`/clients/${clientId}`)
    }
    revalidatePath('/secrets')
}
