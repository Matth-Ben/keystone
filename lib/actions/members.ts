'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function getOrganizationMembers(organizationId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Vérifier que l'utilisateur est membre de l'organisation
    // On utilise le client standard (RLS) pour cette vérification
    // car la politique "view_own_membership" permet de voir sa propre ligne
    const { data: membership, error: membershipError } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .maybeSingle()

    if (membershipError) {
        console.error('Error checking membership:', membershipError)
    }

    if (!membership) {
        console.error(`Membership check failed for user ${user.id} in org ${organizationId}`)
        throw new Error('Vous n\'êtes pas membre de cette organisation')
    }

    // Récupérer les membres avec leurs informations utilisateur
    // On utilise le client ADMIN pour contourner le RLS qui empêche de voir les autres
    const adminClient = createAdminClient() as any

    const { data: members, error } = await adminClient
        .from('organization_members')
        .select(`
            id,
            user_id,
            role
        `)
        .eq('organization_id', organizationId)


    if (error) {
        console.error('Error fetching members:', error)
        throw new Error('Erreur lors de la récupération des membres')
    }

    // Récupérer les infos utilisateurs (email, nom)
    // On doit faire ça séparément car on ne peut pas faire de join facile avec auth.users via l'API publique
    // Mais on peut utiliser adminClient.auth.admin.getUserById() pour chaque membre
    // OU plus simple : on suppose que auth.users est inaccessible via join direct en Service Role API (parfois limité)

    // NOTE: Supabase Admin Client permet l'accès complet, mais le JOIN avec auth.users est délicat.
    // On va plutôt récupérer les emails un par un ou espérer que le JOIN fonctionne si on a les droits.
    // Essayons d'abord sans JOIN auth.users pour voir si ça marche, puis on enrichira.

    // En fait, pour afficher les e-mails, on a besoin de auth.users.
    // L'approche la plus robuste est de récupérer les user_id, puis faire :

    const enrichedMembers = await Promise.all(members.map(async (member: any) => {
        const { data: { user: memberUser }, error: userError } = await adminClient.auth.admin.getUserById(member.user_id)

        return {
            id: member.id,
            user_id: member.user_id,
            role: member.role,
            email: memberUser?.email || 'Email inconnu',
            full_name: memberUser?.user_metadata?.full_name || null,
            created_at: new Date().toISOString(),
        }
    }))

    return enrichedMembers
}

export async function updateMemberRole(
    memberId: string,
    newRole: 'admin' | 'member' | 'restricted'
) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    // Utiliser admin client pour lire et modifier
    const adminClient = createAdminClient() as any

    // Récupérer le membre à modifier
    const { data: memberToUpdate } = await adminClient
        .from('organization_members')
        .select('organization_id, user_id, role')
        .eq('id', memberId)
        .single()

    if (!memberToUpdate) {
        throw new Error('Membre non trouvé')
    }

    // Vérifier que l'utilisateur actuel est admin de l'organisation
    // On utilise adminClient aussi pour être sûr de pouvoir lire
    const { data: currentUserMembership } = await adminClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', memberToUpdate.organization_id)
        .eq('user_id', user.id)
        .single()

    if (!currentUserMembership || currentUserMembership.role !== 'admin') {
        throw new Error('Seuls les admins peuvent modifier les rôles')
    }

    // Vérifier qu'on ne dégrade pas le dernier admin
    if (memberToUpdate.role === 'admin' && newRole !== 'admin') {
        const { count } = await adminClient
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', memberToUpdate.organization_id)
            .eq('role', 'admin')

        if (count === 1) {
            throw new Error('Impossible de modifier le dernier admin de l\'organisation')
        }
    }

    // Mettre à jour le rôle
    const { error } = await adminClient
        .from('organization_members')
        .update({ role: newRole } as any)
        .eq('id', memberId)

    if (error) {
        console.error('Error updating member role:', error)
        throw new Error('Erreur lors de la mise à jour du rôle')
    }

    return { success: true }
}

export async function removeMember(memberId: string) {
    const supabase = await createClient()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        throw new Error('Non authentifié')
    }

    const adminClient = createAdminClient() as any

    // Récupérer le membre à retirer
    const { data: memberToRemove } = await adminClient
        .from('organization_members')
        .select('organization_id, user_id, role')
        .eq('id', memberId)
        .single()

    if (!memberToRemove) {
        throw new Error('Membre non trouvé')
    }

    // Vérifier que l'utilisateur actuel est admin
    const { data: currentUserMembership } = await adminClient
        .from('organization_members')
        .select('role')
        .eq('organization_id', memberToRemove.organization_id)
        .eq('user_id', user.id)
        .single()

    if (!currentUserMembership || currentUserMembership.role !== 'admin') {
        throw new Error('Seuls les admins peuvent retirer des membres')
    }

    // Vérifier qu'on ne retire pas le dernier admin
    if (memberToRemove.role === 'admin') {
        const { count } = await supabase
            .from('organization_members')
            .select('*', { count: 'exact', head: true })
            .eq('organization_id', memberToRemove.organization_id)
            .eq('role', 'admin')

        if (count === 1) {
            throw new Error('Impossible de retirer le dernier admin de l\'organisation')
        }
    }

    // Retirer le membre
    const { error } = await supabase
        .from('organization_members')
        .delete()
        .eq('id', memberId)

    if (error) {
        console.error('Error removing member:', error)
        throw new Error('Erreur lors du retrait du membre')
    }

    return { success: true }
}
