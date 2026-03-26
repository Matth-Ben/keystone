'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface SearchResult {
    type: 'client' | 'project' | 'secret'
    id: string
    name: string
    description?: string
}

export async function globalSearch(query: string, organizationId: string | null): Promise<SearchResult[]> {
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
    const terms = query.trim().split(/\s+/)
    const lowerQuery = query.toLowerCase()
    const lowerTerms = terms.map(t => t.toLowerCase())

    // Mode "Tous mes secrets" : rechercher dans toutes les orgas de l'utilisateur
    if (organizationId === null) {
        const adminClient = createAdminClient() as any

        // Récupérer les IDs des organisations de l'utilisateur
        const { data: memberships } = await adminClient
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)

        const orgIds = memberships?.map((m: { organization_id: string }) => m.organization_id) || []

        // Recherche dans les clients de toutes les organisations
        if (orgIds.length > 0) {
            const { data: clients } = await adminClient
                .from('clients')
                .select('id, name, website, organization_id')
                .in('organization_id', orgIds)
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

            // Recherche dans les projets de toutes les organisations
            const { data: projects } = await adminClient
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
                .limit(20)

            if (projects) {
                const filteredProjects = projects.filter(
                    (p: any) => p.clients && orgIds.includes(p.clients.organization_id)
                )

                results.push(
                    ...filteredProjects.slice(0, 5).map((project: any) => ({
                        type: 'project' as const,
                        id: project.id,
                        name: project.name,
                        description: project.clients?.name || undefined,
                    }))
                )
            }
        }

        // Recherche dans les secrets personnels + organisations
        const secretQueries: Promise<any>[] = [
            // Secrets personnels
            adminClient
                .from('secrets')
                .select('id, title, type, created_by')
                .is('organization_id', null)
                .eq('created_by', user.id)
                .is('deleted_at', null)
                .order('created_at', { ascending: false })
        ]

        // Secrets des organisations
        if (orgIds.length > 0) {
            secretQueries.push(
                adminClient
                    .from('secrets')
                    .select(`
                        id,
                        title,
                        type,
                        clients (
                            name,
                            organization_id
                        )
                    `)
                    .in('organization_id', orgIds)
                    .is('deleted_at', null)
                    .order('created_at', { ascending: false })
            )
        }

        const secretResults = await Promise.all(secretQueries)
        const personalSecrets = secretResults[0]?.data || []
        const orgSecrets = secretResults[1]?.data || []

        // Filtrer et combiner les secrets
        const allSecrets = [...personalSecrets, ...orgSecrets]

        const filteredSecrets = allSecrets.filter((s: any) => {
            const title = (s.title || '').toLowerCase()
            const clientName = (s.clients?.name || '').toLowerCase()
            const type = (s.type || '').toLowerCase()

            const combined = `${clientName} ${title} ${type}`
            if (combined.includes(lowerQuery)) return true

            return lowerTerms.every(term =>
                title.includes(term) || clientName.includes(term) || type.includes(term)
            )
        })

        results.push(
            ...filteredSecrets.slice(0, 5).map((secret: any) => ({
                type: 'secret' as const,
                id: secret.id,
                name: secret.clients?.name
                    ? `${secret.clients.name} - ${secret.title}`
                    : secret.title,
                description: `Type: ${secret.type}`,
            }))
        )

        return results
    }

    // Mode organisation spécifique (comportement original)

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

    // Recherche dans les secrets
    // Stratégie "Fetch & Filter" : On récupère tous les secrets de l'orga (léger) et on filtre en JS.
    // C'est beaucoup plus fiable pour la recherche multi-critères (Client + Titre) que le SQL pur via l'API.

    const { data: secrets } = await supabase
        .from('secrets')
        .select(`
            id,
            title,
            type,
            clients!inner (
                name,
                organization_id
            )
        `)
        .eq('clients.organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (secrets) {
        // Filtrage JS intelligent
        const filteredSecrets = secrets.filter((s: any) => {
            const title = (s.title || '').toLowerCase()
            const clientName = (s.clients?.name || '').toLowerCase()
            const type = (s.type || '').toLowerCase()

            // Score simplifié :
            // - Si la query complète est dans le titre ou client : match direct
            const combined = `${clientName} ${title} ${type}`
            if (combined.includes(lowerQuery)) return true

            // - Sinon, est-ce que TOUS les termes sont présents quelque part ?
            // Ex: "Transbordeur Prod" -> "Transbordeur" dans client, "Prod" dans titre
            return lowerTerms.every(term =>
                title.includes(term) || clientName.includes(term) || type.includes(term)
            )
        })

        // Formatage pour l'affichage
        results.push(
            ...filteredSecrets.slice(0, 5).map((secret: any) => ({
                type: 'secret' as const,
                id: secret.id,
                // On affiche "Client - Titre" pour que ce soit clair
                name: `${secret.clients.name} - ${secret.title}`,
                description: `Type: ${secret.type}`,
            }))
        )
    }

    return results
}
