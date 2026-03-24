'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireOrgRole, assertCanWrite, assertCanDelete } from '@/lib/rbac'

export interface SecretFolder {
    id: string
    organization_id: string | null
    name: string
    color: string | null
    icon: string | null
    position: number
    created_at: string
    updated_at: string
    created_by: string | null
}

export interface CreateFolderData {
    organizationId?: string | null  // null = personal folder
    name: string
    color?: string
    icon?: string
}

export interface UpdateFolderData {
    name?: string
    color?: string | null
    icon?: string | null
}

/**
 * Get all folders for an organization
 */
export async function getFolders(organizationId: string): Promise<SecretFolder[]> {
    // Verify user has access to the org
    await requireOrgRole(organizationId)

    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('secret_folders')
        .select('*')
        .eq('organization_id', organizationId)
        .order('position', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching folders:', error)
        throw new Error('Erreur lors du chargement des dossiers')
    }

    return data as SecretFolder[]
}

/**
 * Get all personal folders for the current user
 */
export async function getPersonalFolders(): Promise<SecretFolder[]> {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('secret_folders')
        .select('*')
        .is('organization_id', null)
        .eq('created_by', user.id)
        .order('position', { ascending: true })
        .order('name', { ascending: true })

    if (error) {
        console.error('Error fetching personal folders:', error)
        throw new Error('Erreur lors du chargement des dossiers')
    }

    return data as SecretFolder[]
}

/**
 * Get all folders accessible by the user (personal + organizations)
 */
export async function getAllUserFolders(): Promise<SecretFolder[]> {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    // Get user's organizations
    const { data: memberships } = await adminClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)

    const orgIds = memberships?.map((m: { organization_id: string }) => m.organization_id) || []

    // Fetch personal folders + org folders in parallel
    const queries: Promise<any>[] = [
        // Personal folders
        adminClient
            .from('secret_folders')
            .select('*')
            .is('organization_id', null)
            .eq('created_by', user.id)
            .order('position', { ascending: true })
    ]

    if (orgIds.length > 0) {
        queries.push(
            adminClient
                .from('secret_folders')
                .select('*')
                .in('organization_id', orgIds)
                .order('position', { ascending: true })
        )
    }

    const results = await Promise.all(queries)

    const personalFolders = results[0].data || []
    const orgFolders = results[1]?.data || []

    return [...personalFolders, ...orgFolders] as SecretFolder[]
}

/**
 * Create a new folder (organization or personal)
 */
export async function createFolder(data: CreateFolderData): Promise<SecretFolder> {
    // 1. Auth + role check
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const isPersonal = !data.organizationId

    // For org folders, verify role
    if (!isPersonal) {
        const { role } = await requireOrgRole(data.organizationId!)
        assertCanWrite(role)
    }

    // 2. Get next position
    const adminClient = createAdminClient() as any

    let positionQuery = adminClient
        .from('secret_folders')
        .select('position')
        .order('position', { ascending: false })
        .limit(1)

    if (isPersonal) {
        positionQuery = positionQuery.is('organization_id', null).eq('created_by', user.id)
    } else {
        positionQuery = positionQuery.eq('organization_id', data.organizationId)
    }

    const { data: lastFolder } = await positionQuery.single()
    const nextPosition = (lastFolder?.position ?? -1) + 1

    // 3. Create folder
    const { data: folder, error } = await adminClient
        .from('secret_folders')
        .insert({
            organization_id: data.organizationId || null,
            name: data.name,
            color: data.color || null,
            icon: data.icon || null,
            position: nextPosition,
            created_by: user.id
        })
        .select()
        .single()

    if (error) {
        if (error.code === '23505') {
            throw new Error('Un dossier avec ce nom existe déjà')
        }
        console.error('Error creating folder:', error)
        throw new Error('Erreur lors de la création du dossier')
    }

    revalidatePath('/secrets')
    return folder as SecretFolder
}

/**
 * Update a folder
 */
export async function updateFolder(folderId: string, data: UpdateFolderData): Promise<void> {
    // 1. Auth
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // 2. Get folder to find org
    const adminClient = createAdminClient() as any

    const { data: folder, error: fetchError } = await adminClient
        .from('secret_folders')
        .select('organization_id, created_by')
        .eq('id', folderId)
        .single()

    if (fetchError || !folder) {
        throw new Error('Dossier introuvable')
    }

    // 3. Role check
    if (folder.organization_id) {
        // Org folder - check role
        const { role } = await requireOrgRole(folder.organization_id)
        assertCanWrite(role)
    } else {
        // Personal folder - check ownership
        if (folder.created_by !== user.id) {
            throw new Error('Accès non autorisé')
        }
    }

    // 4. Update
    const updateData: any = {
        updated_at: new Date().toISOString()
    }

    if (data.name !== undefined) updateData.name = data.name
    if (data.color !== undefined) updateData.color = data.color
    if (data.icon !== undefined) updateData.icon = data.icon

    const { error } = await adminClient
        .from('secret_folders')
        .update(updateData)
        .eq('id', folderId)

    if (error) {
        if (error.code === '23505') {
            throw new Error('Un dossier avec ce nom existe déjà')
        }
        console.error('Error updating folder:', error)
        throw new Error('Erreur lors de la modification du dossier')
    }

    revalidatePath('/secrets')
}

/**
 * Delete a folder (secrets become unfiled)
 */
export async function deleteFolder(folderId: string): Promise<void> {
    // 1. Auth
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    // 2. Get folder to find org
    const adminClient = createAdminClient() as any

    const { data: folder, error: fetchError } = await adminClient
        .from('secret_folders')
        .select('organization_id, created_by')
        .eq('id', folderId)
        .single()

    if (fetchError || !folder) {
        throw new Error('Dossier introuvable')
    }

    // 3. Role check
    if (folder.organization_id) {
        // Org folder - only admins can delete
        const { role } = await requireOrgRole(folder.organization_id)
        assertCanDelete(role)
    } else {
        // Personal folder - check ownership
        if (folder.created_by !== user.id) {
            throw new Error('Accès non autorisé')
        }
    }

    // 4. Remove folder_id from secrets in this folder (they become unfiled)
    await adminClient
        .from('secrets')
        .update({ folder_id: null })
        .eq('folder_id', folderId)

    // 5. Delete folder
    const { error } = await adminClient
        .from('secret_folders')
        .delete()
        .eq('id', folderId)

    if (error) {
        console.error('Error deleting folder:', error)
        throw new Error('Erreur lors de la suppression du dossier')
    }

    revalidatePath('/secrets')
}

/**
 * Move a secret to a folder (or remove from folder if folderId is null)
 */
export async function moveSecretToFolder(secretId: string, folderId: string | null): Promise<void> {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    // 1. Get secret to verify access
    const { data: secret, error: secretError } = await adminClient
        .from('secrets')
        .select('organization_id, created_by')
        .eq('id', secretId)
        .single()

    if (secretError || !secret) {
        throw new Error('Secret introuvable')
    }

    // 2. Check access
    const isPersonalSecret = !secret.organization_id

    if (isPersonalSecret) {
        // Personal secret - only creator can move
        if (secret.created_by !== user.id) {
            throw new Error('Accès non autorisé')
        }
    } else {
        // Org secret - verify role
        const { role } = await requireOrgRole(secret.organization_id)
        assertCanWrite(role)
    }

    // 3. If folderId provided, verify folder compatibility
    if (folderId) {
        const { data: folder, error: folderError } = await adminClient
            .from('secret_folders')
            .select('organization_id, created_by')
            .eq('id', folderId)
            .single()

        if (folderError || !folder) {
            throw new Error('Dossier introuvable')
        }

        if (isPersonalSecret) {
            // Personal secret can only go into personal folder owned by same user
            if (folder.organization_id !== null || folder.created_by !== user.id) {
                throw new Error('Ce dossier n\'est pas accessible')
            }
        } else {
            // Org secret can only go into org folder of same org
            if (folder.organization_id !== secret.organization_id) {
                throw new Error('Le dossier doit appartenir à la même organisation')
            }
        }
    }

    // 4. Update secret
    const { error: updateError } = await adminClient
        .from('secrets')
        .update({
            folder_id: folderId,
            updated_at: new Date().toISOString()
        })
        .eq('id', secretId)

    if (updateError) {
        console.error('Error moving secret:', updateError)
        throw new Error('Erreur lors du déplacement du secret')
    }

    revalidatePath('/secrets')
}

/**
 * Reorder folders within an organization
 */
export async function reorderFolders(organizationId: string, folderIds: string[]): Promise<void> {
    const { role } = await requireOrgRole(organizationId)
    assertCanWrite(role)

    const adminClient = createAdminClient() as any

    // Update positions in a transaction-like manner
    const updates = folderIds.map((id, index) =>
        adminClient
            .from('secret_folders')
            .update({ position: index })
            .eq('id', id)
            .eq('organization_id', organizationId)
    )

    await Promise.all(updates)

    revalidatePath('/secrets')
}

/**
 * Reorder personal folders
 */
export async function reorderPersonalFolders(folderIds: string[]): Promise<void> {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    // Update positions - only for folders owned by this user with no org
    const updates = folderIds.map((id, index) =>
        adminClient
            .from('secret_folders')
            .update({ position: index })
            .eq('id', id)
            .is('organization_id', null)
            .eq('created_by', user.id)
    )

    await Promise.all(updates)

    revalidatePath('/secrets')
}

/**
 * Move a secret to a client (or remove from client if clientId is null)
 */
export async function moveSecretToClient(secretId: string, clientId: string | null): Promise<void> {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    // 1. Get secret to verify access
    const { data: secret, error: secretError } = await adminClient
        .from('secrets')
        .select('organization_id, created_by, client_id')
        .eq('id', secretId)
        .single()

    if (secretError || !secret) {
        throw new Error('Secret introuvable')
    }

    // 2. Check access
    if (!secret.organization_id) {
        // Personal secret - only creator can move
        if (secret.created_by !== user.id) {
            throw new Error('Accès non autorisé')
        }
    } else {
        // Org secret - verify role
        const { role } = await requireOrgRole(secret.organization_id)
        assertCanWrite(role)
    }

    // 3. If clientId provided, verify client belongs to same org
    if (clientId) {
        const { data: client, error: clientError } = await adminClient
            .from('clients')
            .select('organization_id')
            .eq('id', clientId)
            .single()

        if (clientError || !client) {
            throw new Error('Client introuvable')
        }

        if (secret.organization_id && client.organization_id !== secret.organization_id) {
            throw new Error('Le client doit appartenir à la même organisation')
        }
    }

    // 4. Update secret - when moving to a client, remove from custom folder
    const { error: updateError } = await adminClient
        .from('secrets')
        .update({
            client_id: clientId,
            folder_id: null, // Remove from custom folder when assigning to client
            updated_at: new Date().toISOString()
        })
        .eq('id', secretId)

    if (updateError) {
        console.error('Error moving secret to client:', updateError)
        throw new Error('Erreur lors du déplacement du secret')
    }

    revalidatePath('/secrets')
}
