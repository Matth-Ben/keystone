'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getClient } from './clients'

export interface Project {
    id: string
    name: string
    description: string | null
    client_id: string
    organization_id: string
    created_at: string
}

// Fonction de base pour vérifier l'accès à un projet
async function checkProjectAccess(projectId: string) {
    const adminClient = createAdminClient()

    // Récupérer le projet pour connaître l'organisation
    const { data: project, error } = await adminClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (error || !project) {
        throw new Error('Projet non trouvé')
    }

    // Vérifier l'accès à l'organisation via le client standard
    // On réutilise la logique de getClient qui sait vérifier l'accès
    // Mais ici on doit vérifier manuellement l'organisation du projet
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', project.organization_id)
        .eq('user_id', user.id)
        .maybeSingle()

    if (!membership) {
        throw new Error('Accès refusé à ce projet')
    }

    return { user, project }
}

export async function getProjects(clientId: string) {
    // 1. Vérifier l'accès au client (vérifie implicitement l'organisation)
    const client = await getClient(clientId)

    // 2. Récupérer les projets
    const adminClient = createAdminClient()

    const { data: projects, error } = await adminClient
        .from('projects')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Error fetching projects:', error)
        throw new Error('Erreur lors de la récupération des projets')
    }

    return projects as Project[]
}

export async function getProject(projectId: string) {
    const { project } = await checkProjectAccess(projectId)
    return project as Project
}

export async function createProject(data: {
    name: string
    description?: string
    clientId: string
}) {
    // 1. Vérifier l'accès au client et récupérer son org_id
    const client = await getClient(data.clientId)

    // 2. Créer le projet
    const adminClient = createAdminClient()

    const { data: newProject, error } = await adminClient
        .from('projects')
        .insert({
            name: data.name,
            description: data.description,
            client_id: data.clientId,
            organization_id: client.organization_id,
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating project:', error)
        throw new Error('Erreur lors de la création du projet')
    }

    revalidatePath(`/clients/${data.clientId}`)
    return newProject as Project
}

export async function updateProject(projectId: string, data: {
    name?: string
    description?: string
}) {
    // 1. Vérifier l'accès
    const { project } = await checkProjectAccess(projectId)

    // 2. Mise à jour
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('projects')
        .update({
            name: data.name,
            description: data.description,
        })
        .eq('id', projectId)

    if (error) {
        console.error('Error updating project:', error)
        throw new Error('Erreur lors de la mise à jour du projet')
    }

    revalidatePath(`/projects/${projectId}`)
    revalidatePath(`/clients/${project.client_id}`)
    return { success: true }
}

export async function deleteProject(projectId: string) {
    // 1. Vérifier l'accès
    const { project } = await checkProjectAccess(projectId)

    // 2. Suppression
    const adminClient = createAdminClient()

    const { error } = await adminClient
        .from('projects')
        .delete()
        .eq('id', projectId)

    if (error) {
        console.error('Error deleting project:', error)
        throw new Error('Erreur lors de la suppression du projet')
    }

    revalidatePath(`/clients/${project.client_id}`)
    return { success: true }
}
