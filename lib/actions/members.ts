'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireOrgRole, assertCanManageMembers } from '@/lib/rbac'
import { revalidatePath } from 'next/cache'
import { sendInvitationEmail } from '@/lib/email'

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

    // Retirer le membre (admin client pour bypasser le RLS)
    const { error } = await adminClient
        .from('organization_members')
        .delete()
        .eq('id', memberId)

    if (error) {
        console.error('Error removing member:', error)
        throw new Error('Erreur lors du retrait du membre')
    }

    revalidatePath('/organization')
    return { success: true }
}

export async function getInvitations(organizationId: string) {
    const { role } = await requireOrgRole(organizationId)
    assertCanManageMembers(role)

    const adminClient = createAdminClient() as any

    const { data, error } = await adminClient
        .from('invitations')
        .select('id, email, role, created_at, expires_at')
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

    if (error) throw new Error('Erreur lors de la récupération des invitations')
    return data as { id: string; email: string; role: string; created_at: string; expires_at: string }[]
}

export async function inviteMember(
    organizationId: string,
    email: string,
    role: 'admin' | 'member' | 'restricted'
) {
    const { userId, role: currentUserRole } = await requireOrgRole(organizationId)
    assertCanManageMembers(currentUserRole)

    const adminClient = createAdminClient() as any

    // Vérifier qu'il n'y a pas déjà une invitation en attente pour cet email
    const { data: existing } = await adminClient
        .from('invitations')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('email', email)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .maybeSingle()

    if (existing) {
        throw new Error('Une invitation est déjà en attente pour cet email')
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { error } = await adminClient
        .from('invitations')
        .insert({
            organization_id: organizationId,
            email,
            role,
            invited_by: userId,
            status: 'pending',
            token,
            expires_at: expiresAt,
        })

    if (error) {
        console.error('Error creating invitation:', error)
        throw new Error('Erreur lors de la création de l\'invitation')
    }

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_URL}/invite/${token}`

    // Récupérer le nom de l'organisation pour l'email
    const { data: org } = await adminClient
        .from('organizations')
        .select('name')
        .eq('id', organizationId)
        .single()

    // Envoyer l'email d'invitation (on ne throw pas si ça échoue pour ne pas bloquer)
    try {
        await sendInvitationEmail({
            to: email,
            orgName: org?.name ?? 'l\'organisation',
            role,
            inviteUrl,
        })
    } catch (emailError) {
        console.error('Failed to send invitation email:', emailError)
    }

    revalidatePath('/organization')
    return { inviteUrl }
}

export async function cancelInvitation(invitationId: string) {
    const adminClient = createAdminClient() as any

    const { data: invitation } = await adminClient
        .from('invitations')
        .select('organization_id')
        .eq('id', invitationId)
        .single()

    if (!invitation) throw new Error('Invitation non trouvée')

    const { role } = await requireOrgRole(invitation.organization_id)
    assertCanManageMembers(role)

    const { error } = await adminClient
        .from('invitations')
        .update({ status: 'declined' })
        .eq('id', invitationId)

    if (error) throw new Error('Erreur lors de l\'annulation de l\'invitation')

    revalidatePath('/settings/members')
    return { success: true }
}

export async function acceptInvitation(token: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')

    const adminClient = createAdminClient() as any

    const { data: invitation } = await adminClient
        .from('invitations')
        .select('*')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

    if (!invitation) throw new Error('Invitation invalide ou expirée')
    if (invitation.email !== user.email) throw new Error('Cette invitation est destinée à une autre adresse email')

    // Ajouter à l'organisation
    const { error: memberError } = await adminClient
        .from('organization_members')
        .insert({
            organization_id: invitation.organization_id,
            user_id: user.id,
            role: invitation.role,
        })

    if (memberError && memberError.code !== '23505') {
        throw new Error('Erreur lors de l\'ajout à l\'organisation')
    }

    // Marquer l'invitation comme acceptée
    await adminClient
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id)

    return { organizationId: invitation.organization_id }
}
