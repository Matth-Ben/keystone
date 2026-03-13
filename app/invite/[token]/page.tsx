import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { acceptInvitation } from '@/lib/actions/members'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface PageProps {
    params: Promise<{ token: string }>
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    member: 'Éditeur',
    restricted: 'Lecteur',
}

export default async function InvitePage({ params }: PageProps) {
    const { token } = await params

    // Récupérer l'invitation
    const adminClient = createAdminClient() as any
    const { data: invitation } = await adminClient
        .from('invitations')
        .select('id, email, role, organization_id, organizations(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .single()

    if (!invitation) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-bold">Invitation invalide</h1>
                    <p className="text-muted-foreground">Ce lien d'invitation est invalide ou a expiré.</p>
                    <Button asChild variant="outline">
                        <a href="/clients">Retour à l'accueil</a>
                    </Button>
                </div>
            </div>
        )
    }

    const orgName = (invitation.organizations as any)?.name || 'l\'organisation'

    // Vérifier si l'utilisateur est connecté
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect(`/login?next=/invite/${token}`)
    }

    // Email mismatch
    if (user.email !== invitation.email) {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-3 max-w-sm">
                    <h1 className="text-2xl font-bold">Mauvais compte</h1>
                    <p className="text-muted-foreground">
                        Cette invitation est destinée à <strong>{invitation.email}</strong>.
                        Vous êtes connecté avec <strong>{user.email}</strong>.
                    </p>
                    <Button asChild variant="outline">
                        <a href="/clients">Retour à l'accueil</a>
                    </Button>
                </div>
            </div>
        )
    }

    // Accepter automatiquement l'invitation
    try {
        const { organizationId } = await acceptInvitation(token)
        redirect(`/auth/set-org?orgId=${organizationId}&next=/clients`)
    } catch {
        return (
            <div className="flex min-h-screen items-center justify-center">
                <div className="text-center space-y-3">
                    <h1 className="text-2xl font-bold">Erreur</h1>
                    <p className="text-muted-foreground">
                        Une erreur est survenue lors de l'acceptation de l'invitation.
                    </p>
                    <Button asChild variant="outline">
                        <a href="/clients">Retour à l'accueil</a>
                    </Button>
                </div>
            </div>
        )
    }
}
