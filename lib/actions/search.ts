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
        let filteredSecrets = secrets

        const terms = query.trim().split(/\s+/)
        const lowerQuery = query.toLowerCase()
        const lowerTerms = terms.map(t => t.toLowerCase())

        // 2. Filtrage JS intelligent
        filteredSecrets = secrets.filter((s: any) => {
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

        // 3. Formatage pour l'affichage
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
