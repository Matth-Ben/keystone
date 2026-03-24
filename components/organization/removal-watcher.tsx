'use client'

import { useEffect, useState, useRef } from 'react'
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
    const userIdRef = useRef<string | null>(null)

    useEffect(() => {
        let channel: ReturnType<typeof supabase.channel> | null = null

        const setup = async () => {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            userIdRef.current = user.id

            // 1. Verification immediate au chargement (pour detecter un retrait lors de la premiere visite)
            const { data } = await supabase
                .from('organization_members')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('user_id', user.id)
                .maybeSingle()

            if (data === null) {
                setRemoved(true)
                return // Pas besoin de souscrire si deja retire
            }

            // 2. Souscription Realtime pour detection instantanee des suppressions
            channel = supabase
                .channel(`removal-watcher-${organizationId}-${user.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'DELETE',
                        schema: 'public',
                        table: 'organization_members',
                        filter: `organization_id=eq.${organizationId}`,
                    },
                    (payload) => {
                        // Verifier si c'est l'utilisateur courant qui a ete retire
                        if (payload.old && (payload.old as { user_id: string }).user_id === userIdRef.current) {
                            setRemoved(true)
                        }
                    }
                )
                .subscribe()

            // 3. Verification au focus de la fenetre (fallback si realtime rate un evenement)
            const checkMembership = async () => {
                if (!userIdRef.current) return
                const { data } = await supabase
                    .from('organization_members')
                    .select('id')
                    .eq('organization_id', organizationId)
                    .eq('user_id', userIdRef.current)
                    .maybeSingle()

                if (data === null) {
                    setRemoved(true)
                }
            }

            window.addEventListener('focus', checkMembership)

            return () => {
                window.removeEventListener('focus', checkMembership)
            }
        }

        setup()

        return () => {
            if (channel) {
                supabase.removeChannel(channel)
            }
        }
    }, [organizationId, supabase])

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
