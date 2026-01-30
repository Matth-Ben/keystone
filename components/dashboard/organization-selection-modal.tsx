'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Organization } from '@/lib/store/app-store'
import { setOrganizationCookie } from '@/lib/actions/organization-cookie'
import { cn } from '@/lib/utils'

interface OrganizationSelectionModalProps {
    organizations: Organization[]
    isOpen: boolean
}

export function OrganizationSelectionModal({
    organizations,
    isOpen,
}: OrganizationSelectionModalProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleSelect = async (orgId: string) => {
        setIsLoading(true)
        try {
            await setOrganizationCookie(orgId)
            // Force a hard refresh to ensure all server components re-run with the new cookie
            window.location.reload()
        } catch (error) {
            console.error('Failed to set organization cookie', error)
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen}>
            <DialogContent className="sm:max-w-md" showCloseButton={false}>
                <DialogHeader>
                    <DialogTitle>Sélectionnez une organisation</DialogTitle>
                    <DialogDescription>
                        Veuillez choisir une organisation pour continuer.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    {organizations.map((org) => (
                        <Button
                            key={org.id}
                            variant="outline"
                            className="h-auto flex-col items-start gap-1 p-4 hover:bg-accent"
                            onClick={() => handleSelect(org.id)}
                            disabled={isLoading}
                        >
                            <div className="flex w-full items-center justify-between">
                                <span className="font-semibold">{org.name}</span>
                                {org.logo_url && (
                                    <div
                                        className="h-6 w-6 rounded-full"
                                        style={{ backgroundColor: org.brand_color || 'var(--primary)' }}
                                    />
                                )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                                {org.slug}
                            </span>
                        </Button>
                    ))}
                    {organizations.length === 0 && (
                        <div className="text-center text-sm text-muted-foreground">
                            Aucune organisation trouvée.
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
