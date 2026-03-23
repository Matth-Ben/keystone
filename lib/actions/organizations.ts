'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { requireOrgRole, assertCanUpdateOrg } from '@/lib/rbac'

export async function getUserOrganizations() {
    // 1. Vérification de l'authentification
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // 2. Récupération des organisations (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data: memberships, error } = await adminClient
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
    // 1. Vérification de l'authentification
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // 2. Créer le slug à partir du nom
    const slug = name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Retirer les accents
        .replace(/[^a-z0-9]+/g, '-') // Remplacer les caractères spéciaux par des tirets
        .replace(/^-+|-+$/g, '') // Retirer les tirets au début et à la fin

    // 3. Création (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    // Créer l'organisation
    const { data: organization, error: orgError } = await adminClient
        .from('organizations')
        .insert({
            name,
            slug,
            owner_id: user.id,
        })
        .select()
        .single()

    if (orgError) {
        console.error('Error creating organization:', orgError)
        throw new Error('Erreur lors de la création de l\'organisation')
    }

    // Ajouter l'utilisateur comme admin de l'organisation
    const { error: memberError } = await adminClient
        .from('organization_members')
        .insert({
            organization_id: organization.id,
            user_id: user.id,
            role: 'admin',
        })

    if (memberError) {
        // Ignorer l'erreur si l'utilisateur est déjà membre (code 23505)
        if (memberError.code === '23505') {
            console.log('User already member of organization, continuing...')
        } else {
            console.error('Error adding user to organization:', memberError)
        }
    }

    revalidatePath('/', 'layout')
    return {
        id: organization.id,
        name: organization.name,
        slug: organization.slug,
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
    drive_folder_url?: string | null
}

export async function getOrganization(organizationId: string): Promise<OrganizationDetails> {
    // 1. Vérification des permissions (tous les membres peuvent lire)
    await requireOrgRole(organizationId)

    // 2. Récupération des données (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('organizations')
        .select('id, name, slug, logo_url, brand_color, description, links, drive_folder_url')
        .eq('id', organizationId)
        .single()

    if (error) {
        console.error('Error fetching organization:', error)
        throw new Error('Organisation introuvable')
    }

    return data
}



// ...

export async function updateOrganization(
    organizationId: string,
    data: {
        name: string
        logo_url?: string
        brand_color?: string
        description?: string
        links?: { label: string; url: string }[]
        drive_folder_url?: string
    }
) {
    // 1. Vérification du rôle : admin requis
    const { role } = await requireOrgRole(organizationId)
    assertCanUpdateOrg(role)

    // 2. Mise à jour (Admin Client pour contourner RLS)
    const adminClient = createAdminClient() as any

    const { error, data: updateData } = await adminClient
        .from('organizations')
        .update({
            name: data.name,
            logo_url: data.logo_url,
            brand_color: data.brand_color,
            description: data.description,
            links: data.links,
            drive_folder_url: data.drive_folder_url,
        })
        .eq('id', organizationId)
        .select()

    if (error) {
        console.error('Supabase error details:', JSON.stringify(error, null, 2))
        throw new Error(`Erreur lors de la mise à jour: ${error.message}`)
    }

    revalidatePath('/organization')
    return { success: true }
}
