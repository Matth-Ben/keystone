'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { getClient } from './clients'
import { requireOrgRole, assertCanWrite, assertCanDelete } from '@/lib/rbac'

export interface Project {
    id: string
    name: string
    description: string | null
    client_id: string
    organization_id: string
    created_at: string
}

// Vérifie l'accès à un projet et retourne le projet + le rôle de l'utilisateur
async function checkProjectAccess(projectId: string) {
    const adminClient = createAdminClient()

    const { data: project, error } = await adminClient
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single()

    if (error || !project) {
        throw new Error('Projet non trouvé')
    }

    const { userId, role } = await requireOrgRole(project.organization_id)

    return { userId, role, project }
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
    // 1. Vérifier l'accès + permission écriture
    const client = await getClient(data.clientId)
    const { role } = await requireOrgRole(client.organization_id)
    assertCanWrite(role)

    // 2. Créer le projet
    const adminClient = createAdminClient() as any

    const { data: newProject, error } = await adminClient
        .from('projects')
        .insert({
            name: data.name,
            description: data.description,
            client_id: data.clientId,
            organization_id: client.organization_id,
        } as any)
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
    // 1. Vérifier l'accès + permission écriture
    const { project, role } = await checkProjectAccess(projectId)
    assertCanWrite(role)

    // 2. Mise à jour
    const adminClient = createAdminClient() as any

    const { error } = await adminClient
        .from('projects')
        .update({
            name: data.name,
            description: data.description,
        } as any)
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
    // 1. Vérifier l'accès + permission admin
    const { project, role } = await checkProjectAccess(projectId)
    assertCanDelete(role)

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
