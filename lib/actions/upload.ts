'use server'

import { createClient } from '@/lib/supabase/server'

export async function uploadOrganizationLogo(formData: FormData): Promise<string> {
    const supabase = await createClient()

    const file = formData.get('file') as File
    if (!file) {
        throw new Error('Aucun fichier fourni')
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez JPG, PNG, WebP ou SVG.')
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('L\'image ne doit pas dépasser 2 MB')
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `logos/${fileName}`

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
        .from('organization-assets')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Upload error:', error)
        throw new Error('Erreur lors de l\'upload de l\'image')
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
        .from('organization-assets')
        .getPublicUrl(filePath)

    return publicUrl
}

export async function deleteOrganizationLogo(logoUrl: string): Promise<void> {
    const supabase = await createClient()

    // Extraire le chemin du fichier depuis l'URL
    const urlParts = logoUrl.split('/organization-assets/')
    if (urlParts.length < 2) return

    const filePath = urlParts[1]

    await supabase.storage
        .from('organization-assets')
        .remove([filePath])
}

export async function uploadUserAvatar(formData: FormData): Promise<string> {
    const supabase = await createClient()

    const file = formData.get('file') as File
    if (!file) {
        throw new Error('Aucun fichier fourni')
    }

    // Vérifier le type de fichier
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
        throw new Error('Format non supporté. Utilisez JPG, PNG ou WebP.')
    }

    // Vérifier la taille (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        throw new Error('L\'image ne doit pas dépasser 2 MB')
    }

    // Générer un nom de fichier unique
    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload vers Supabase Storage
    const { data, error } = await supabase.storage
        .from('user-assets')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        })

    if (error) {
        console.error('Upload error:', error)
        throw new Error('Erreur lors de l\'upload de l\'avatar')
    }

    // Récupérer l'URL publique
    const { data: { publicUrl } } = supabase.storage
        .from('user-assets')
        .getPublicUrl(filePath)

    return publicUrl
}
