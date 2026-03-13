import { getOrganizationCookie } from '@/lib/actions/organization-cookie'
import { getOrganization } from '@/lib/actions/organizations'
import { getOrganizationMembers, getInvitations } from '@/lib/actions/members'
import { createClient } from '@/lib/supabase/server'
import { OrganizationView } from '@/components/organization/organization-view'
import { redirect } from 'next/navigation'

export const metadata = {
    title: 'Organisation',
}

export default async function OrganizationPage() {
    const organizationId = await getOrganizationCookie()

    if (!organizationId) {
        redirect('/')
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            redirect('/login')
        }

        const [organization, members] = await Promise.all([
            getOrganization(organizationId),
            getOrganizationMembers(organizationId),
        ])

        const currentMember = members.find(m => m.user_id === user.id)
        const isAdmin = currentMember?.role === 'admin'

        const invitations = isAdmin ? await getInvitations(organizationId) : []

        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Organisation</h1>
                    <p className="text-muted-foreground">
                        Gérez les paramètres de l'organisation et ses membres
                    </p>
                </div>

                <OrganizationView
                    organization={organization}
                    members={members}
                    invitations={invitations}
                    organizationId={organizationId}
                    isAdmin={isAdmin}
                />
            </div>
        )
    } catch {
        return (
            <div className="p-8 text-center">
                <h3 className="text-lg font-semibold">Organisation introuvable</h3>
                <p className="text-muted-foreground">Impossible de charger les détails de l'organisation.</p>
            </div>
        )
    }
}
