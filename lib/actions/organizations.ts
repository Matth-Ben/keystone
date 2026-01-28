'use server'

import { createClient } from '@/lib/supabase/server'

export async function getUserOrganizations() {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Récupérer les organisations dont l'utilisateur est membre
    const { data: memberships, error } = await supabase
        .from('organization_members')
        .select(`
            role,
            organizations (
                id,
                name,
                slug,
                logo_url,
                brand_color
            )
        `)
        .eq('user_id', user.id)

    if (error) {
        console.error('Error fetching organizations:', error)
        throw new Error('Erreur lors de la récupération des organisations')
    }

    // Transformer les données pour avoir un format plus simple
    const organizations = memberships?.map((membership: any) => ({
        id: membership.organizations.id,
        name: membership.organizations.name,
        slug: membership.organizations.slug,
        logo_url: membership.organizations.logo_url,
        brand_color: membership.organizations.brand_color,
        role: membership.role,
    })) || []

    return organizations
}

export async function createOrganization(name: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Créer le slug à partir du nom
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, '') // Retirer les tirets au début et à la fin

    // Créer l'organisation
    const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert({
            name,
            slug,
            owner_id: user.id,
        } as any)
        .select()
        .single()

    if (orgError) {
        console.error('Error creating organization:', orgError)
        throw new Error('Erreur lors de la création de l\'organisation')
    }

    // Ajouter l'utilisateur comme admin de l'organisation
    const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
            organization_id: (organization as any).id,
            user_id: user.id,
            role: 'admin',
        } as any)

    if (memberError) {
        // Ignorer l'erreur si l'utilisateur est déjà membre (code 23505)
        if (memberError.code === '23505') {
            console.log('User already member of organization, continuing...')
        } else {
            console.error('Error adding user to organization:', memberError)
            // On ne throw pas ici pour ne pas bloquer le flux, car l'org est créée
            // et l'utilisateur est probablement déjà dedans
        }
    }

    // ... (existing code for createOrganization)
    return {
        id: (organization as any).id,
        name: (organization as any).name,
        slug: (organization as any).slug,
        role: 'admin' as const,
    }
}

export interface OrganizationDetails {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    brand_color?: string | null
    description?: string | null
    links?: { label: string; url: string }[] | null
}

export async function getOrganization(organizationId: string): Promise<OrganizationDetails> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug, logo_url, brand_color, description, links')
        .eq('id', organizationId)
        .single()

    if (error) {
        console.error('Error fetching organization:', error)
        throw new Error('Organisation introuvable')
    }

    return data
}

import { revalidatePath } from 'next/cache'

// ...

export async function updateOrganization(
    organizationId: string,
    data: {
        name: string
        logo_url?: string
        brand_color?: string
        description?: string
        links?: { label: string; url: string }[]
    }
) {
    const supabase = await createClient()

    console.log('UPDATING Organization', organizationId, data)

    // Vérifier les droits (RLS devrait gérer, mais on peut vérifier membership admin ici si besoin)
    // Pour l'instant on fait confiance aux policies Supabase + vérif auth

    const { error, data: updateData } = await (supabase
        .from('organizations') as any)
        .update({
            name: data.name,
            logo_url: data.logo_url,
            brand_color: data.brand_color,
            description: data.description,
            links: data.links,
        } as any)
        .eq('id', organizationId)
        .select()

    console.log('Update result:', { error, updateData })

    if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2))
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }

    revalidatePath('/organization')
    return { success: true }
}
