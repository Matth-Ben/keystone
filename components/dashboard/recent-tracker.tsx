'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store/app-store'

interface RecentTrackerProps {
    type: 'client' | 'project'
    id: string
    name: string
    organizationId?: string | null
}

export function RecentTracker({ type, id, name, organizationId }: RecentTrackerProps) {
    const { addRecent } = useAppStore()

    useEffect(() => {
        addRecent({
            type,
            id,
            name,
            timestamp: Date.now(),
            organizationId: organizationId || null,
        })
    }, [type, id, name, organizationId, addRecent])

    return null
}
