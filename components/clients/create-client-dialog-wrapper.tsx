'use client'

import { useRouter } from 'next/navigation'
import { CreateClientDialog } from '@/components/clients/create-client-dialog'

export function CreateClientDialogWrapper() {
    const router = useRouter()

    return (
        <CreateClientDialog
            onClientCreated={() => router.refresh()}
        />
    )
}
