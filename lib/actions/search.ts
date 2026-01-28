'use server'

import { createClient } from '@/lib/supabase/server'

interface SearchResult {
    type: 'client' | 'project' | 'secret'
    id: string
    name: string
    description?: string
}

export async function globalSearch(query: string, organizationId: string): Promise<SearchResult[]> {
    if (!query || query.trim().length < 2) {
        return []
    }

    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const results: SearchResult[] = []

    // Recherche dans les clients
    const { data: clients } = await supabase
        .from('clients')
        .select('id, name, website')
        .eq('organization_id', organizationId)
        .ilike('name', `%${query}%`)
        .limit(5)

    if (clients) {
        results.push(
            ...clients.map((client: any) => ({
                type: 'client' as const,
                id: client.id,
                name: client.name,
                description: client.website || undefined,
            }))
        )
    }

    // Recherche dans les projets
    const { data: projects } = await supabase
        .from('projects')
        .select(`
            id,
            name,
            clients (
                name,
                organization_id
            )
        `)
        .ilike('name', `%${query}%`)
        .limit(5)

    if (projects) {
        // Filtrer par organization_id via la relation client
        const filteredProjects = projects.filter(
            (p: any) => p.clients?.organization_id === organizationId
        )

        results.push(
            ...filteredProjects.map((project: any) => ({
                type: 'project' as const,
                id: project.id,
                name: project.name,
                description: project.clients?.name || undefined,
            }))
        )
    }

    // Recherche dans les secrets (titre uniquement, pas les mots de passe)
    const { data: secrets } = await supabase
        .from('secrets')
        .select(`
            id,
            title,
            type,
            projects (
                id,
                clients (
                    organization_id
                )
            )
        `)
        .ilike('title', `%${query}%`)
        .limit(5)

    if (secrets) {
        // Filtrer par organization_id via la relation project -> client
        const filteredSecrets = secrets.filter(
            (s: any) => s.projects?.clients?.organization_id === organizationId
        )

        results.push(
            ...filteredSecrets.map((secret: any) => ({
                type: 'secret' as const,
                id: secret.id,
                name: secret.title,
                description: secret.type || undefined,
            }))
        )
    }

    return results
}
