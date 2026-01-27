'use server'

import { createClient } from '@/lib/supabase/server'
import { encrypt, decrypt } from '@/lib/vault'
import { revalidatePath } from 'next/cache'

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

export async function getSecrets(clientId: string): Promise<Secret[]> {
    const supabase = await createClient() as any

    const { data, error } = await supabase
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

export async function createSecret(data: SecretFormData) {
    const supabase = await createClient() as any
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')
    if (!data.password) throw new Error('Le mot de passe/clé est requis')

    const encrypted_password = encrypt(data.password)

    const { error } = await supabase
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
}

export async function revealSecret(secretId: string): Promise<string> {
    const supabase = await createClient() as any

    // TODO: Ajouter un log d'audit ici ("User X revealed Secret Y")

    const { data, error } = await supabase
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
    const supabase = await createClient() as any

    // Soft delete
    const { error } = await supabase
        .from('secrets')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', secretId)

    if (error) {
        throw new Error('Erreur lors de la suppression')
    }

    revalidatePath(`/clients/${clientId}`)
}

export async function updateSecret(secretId: string, clientId: string, data: Partial<SecretFormData>) {
    const supabase = await createClient() as any

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

    const { error } = await supabase
        .from('secrets')
        .update(updateData)
        .eq('id', secretId)

    if (error) {
        console.error('Error updating secret:', error)
        throw new Error('Erreur lors de la modification')
    }

    revalidatePath(`/clients/${clientId}`)
}
