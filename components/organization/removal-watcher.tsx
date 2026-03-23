'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { getUserOrganizations } from '@/lib/actions/organizations'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface RemovalWatcherProps {
    organizationId: string
    organizationName: string
}

export function RemovalWatcher({ organizationId, organizationName }: RemovalWatcherProps) {
    const [removed, setRemoved] = useState(false)
    const [redirecting, setRedirecting] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        let userId: string | null = null
        let cleanup: (() => void) | null = null

        supabase.auth.getUser().then(({ data: { user } }) => {
            if (!user) return
            userId = user.id

            const checkMembership = async () => {
                if (!userId) return
                const { data } = await supabase
                    .from('organization_members')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .eq('user_id', userId)
                    .maybeSingle()

                // Si l'utilisateur n'est plus membre, afficher la modal
                // Si l'utilisateur est de nouveau membre, masquer la modal
                setRemoved(data === null)
            }

            // Vérification périodique + au focus de la fenêtre
            const interval = setInterval(checkMembership, 30_000)
            window.addEventListener('focus', checkMembership)

            cleanup = () => {
                clearInterval(interval)
                window.removeEventListener('focus', checkMembership)
            }
        })

        return () => cleanup?.()
    }, [organizationId])

    const handleConfirm = async () => {
        setRedirecting(true)
        try {
            const orgs = await getUserOrganizations()
            const other = orgs.find((o: { id: string }) => o.id !== organizationId)
            if (other) {
                window.location.href = `/auth/set-org?orgId=${other.id}&next=/clients`
            } else {
                window.location.href = '/onboarding'
            }
        } catch {
            window.location.href = '/onboarding'
        }
    }

    return (
        <Dialog open={removed}>
            <DialogContent className="sm:max-w-sm" onInteractOutside={(e) => e.preventDefault()}>
                <DialogHeader>
                    <DialogTitle>Accès révoqué</DialogTitle>
                    <DialogDescription>
                        Vous avez été retiré de l'organisation <strong>{organizationName}</strong>.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={handleConfirm} disabled={redirecting} className="w-full">
                        {redirecting ? 'Redirection...' : 'Continuer'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
