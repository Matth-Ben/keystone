'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store/app-store'

interface RecentTrackerProps {
    type: 'client' | 'project'
    id: string
    name: string
}

export function RecentTracker({ type, id, name }: RecentTrackerProps) {
    const { addRecent } = useAppStore()

    useEffect(() => {
        addRecent({
            type,
            id,
            name,
            timestamp: Date.now(),
        })
    }, [type, id, name, addRecent])

    return null
}
