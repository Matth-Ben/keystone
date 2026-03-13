import { createClient } from '@/lib/supabase/server'

export type OrgRole = 'admin' | 'member' | 'restricted'

/**
 * Vérifie que l'utilisateur est authentifié et membre de l'org donnée.
 * Retourne son userId et son rôle. Throw sinon.
 */
export async function requireOrgRole(
    orgId: string
): Promise<{ userId: string; role: OrgRole }> {
    const supabase = await createClient()
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) throw new Error('Non authentifié')

    const { data: membership } = await supabase
        .from('organization_members')
        .select('role')
        .eq('organization_id', orgId)
        .eq('user_id', user.id)
        .maybeSingle() as { data: { role: string } | null, error: unknown }

    if (!membership) throw new Error('Accès refusé à cette organisation')

    return { userId: user.id, role: membership.role as OrgRole }
}

// --- Helpers de permission (purs, sans I/O) ---

export function canWrite(role: OrgRole): boolean {
    return role !== 'restricted'
}

export function canDelete(role: OrgRole): boolean {
    return role === 'admin'
}

export function canRevealSecrets(role: OrgRole): boolean {
    return role !== 'restricted'
}

export function canManageMembers(role: OrgRole): boolean {
    return role === 'admin'
}

// --- Assertions (throw si permission refusée) ---

export function assertCanWrite(role: OrgRole): void {
    if (!canWrite(role)) {
        throw new Error('Permission refusée : action non autorisée pour votre rôle')
    }
}

export function assertCanDelete(role: OrgRole): void {
    if (!canDelete(role)) {
        throw new Error('Permission refusée : seuls les admins peuvent supprimer')
    }
}

export function assertCanRevealSecrets(role: OrgRole): void {
    if (!canRevealSecrets(role)) {
        throw new Error('Permission refusée : vous ne pouvez pas révéler les secrets')
    }
}

export function assertCanManageMembers(role: OrgRole): void {
    if (!canManageMembers(role)) {
        throw new Error('Permission refusée : seuls les admins peuvent gérer les membres')
    }
}

export function assertCanUpdateOrg(role: OrgRole): void {
    if (role !== 'admin') {
        throw new Error('Permission refusée : seuls les admins peuvent modifier l\'organisation')
    }
}
