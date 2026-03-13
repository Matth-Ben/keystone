import type { OrgRole } from '@/lib/rbac'

type Permission = 'write' | 'delete' | 'reveal-secrets' | 'manage-members'

function hasPermission(role: OrgRole, permission: Permission): boolean {
    switch (permission) {
        case 'write':
            return role !== 'restricted'
        case 'delete':
            return role === 'admin'
        case 'reveal-secrets':
            return role !== 'restricted'
        case 'manage-members':
            return role === 'admin'
    }
}

/**
 * Affiche `children` uniquement si l'utilisateur a la permission requise.
 * Utilisation : <PermissionGate role={role} require="write">...</PermissionGate>
 */
export function PermissionGate({
    role,
    require,
    children,
    fallback = null,
}: {
    role: OrgRole
    require: Permission
    children: React.ReactNode
    fallback?: React.ReactNode
}) {
    if (!hasPermission(role, require)) return <>{fallback}</>
    return <>{children}</>
}
