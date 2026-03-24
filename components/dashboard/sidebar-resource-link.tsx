'use client'

import { useRouter } from 'next/navigation'
import { Star, Clock } from 'lucide-react'
import { useAppStore, Organization } from '@/lib/store/app-store'
import { setOrganizationCookie } from '@/lib/actions/organization-cookie'
import { cn } from '@/lib/utils'

interface SidebarResourceLinkProps {
    type: 'favorite' | 'recent'
    resourceType: 'client' | 'project'
    resourceId: string
    resourceName: string
    organizationId: string | null
    organizations: Organization[]
}

export function SidebarResourceLink({
    type,
    resourceType,
    resourceId,
    resourceName,
    organizationId,
    organizations,
}: SidebarResourceLinkProps) {
    const router = useRouter()
    const { currentOrganization, setCurrentOrganization } = useAppStore()

    const handleClick = async (e: React.MouseEvent) => {
        e.preventDefault()

        // Si le lien a une organisation et qu'elle est différente de l'actuelle
        if (organizationId && currentOrganization?.id !== organizationId) {
            const targetOrg = organizations.find(org => org.id === organizationId)
            if (targetOrg) {
                // Changer d'organisation
                setCurrentOrganization(targetOrg)
                await setOrganizationCookie(targetOrg.id)
            }
        }

        // Naviguer vers la ressource
        router.push(`/${resourceType}s/${resourceId}`)
    }

    const Icon = type === 'favorite' ? Star : Clock
    const iconClass = type === 'favorite'
        ? 'h-3 w-3 fill-yellow-400 text-yellow-400'
        : 'h-3 w-3'

    return (
        <button
            onClick={handleClick}
            className={cn(
                'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-left',
                'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
            )}
        >
            <Icon className={iconClass} />
            <span className="truncate">{resourceName}</span>
        </button>
    )
}
