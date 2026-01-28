'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface UserProfile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
}

/**
 * Get current user profile
 */
export async function getUserProfile(): Promise<UserProfile> {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error('Non authentifié')
    }

    // Get profile data from profiles table
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('id', user.id)
        .single()

    if (profileError) {
        console.error('Error fetching profile:', profileError)
    }

    return {
        id: user.id,
        email: user.email || '',
        full_name: (profile as any)?.full_name || null,
        avatar_url: (profile as any)?.avatar_url || null
    }
}

/**
 * Update user profile (name and avatar)
 */
export async function updateUserProfile(data: {
    full_name: string
    avatar_url?: string
}) {
    const supabase = await createClient() as any

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error('Non authentifié')
    }

    // Update profile in profiles table
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: data.full_name,
            avatar_url: data.avatar_url
        } as any)
        .eq('id', user.id)

    if (error) {
        console.error('Error updating profile:', error)
        throw new Error('Erreur lors de la mise à jour du profil')
    }

    revalidatePath('/settings')
    return { success: true }
}

/**
 * Update user password
 */
export async function updateUserPassword(data: {
    currentPassword: string
    newPassword: string
}) {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        throw new Error('Non authentifié')
    }

    // Verify current password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: data.currentPassword
    })

    if (signInError) {
        throw new Error('Mot de passe actuel incorrect')
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
        password: data.newPassword
    })

    if (updateError) {
        console.error('Error updating password:', updateError)
        throw new Error('Erreur lors de la mise à jour du mot de passe')
    }

    return { success: true }
}
