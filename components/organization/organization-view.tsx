'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MembersTab } from '@/components/settings/members-tab'
import { OrganizationDetailsForm } from '@/components/organization/organization-details-form'
import { OrganizationDetails } from '@/lib/actions/organizations'

interface OrganizationViewProps {
    organization: OrganizationDetails
    members: any[]
    invitations: any[]
    organizationId: string
    isAdmin: boolean
}

export function OrganizationView({
    organization,
    members,
    invitations,
    organizationId,
    isAdmin,
}: OrganizationViewProps) {
    return (
        <Tabs defaultValue="details" className="space-y-4">
            <TabsList>
                <TabsTrigger value="details">Détails</TabsTrigger>
                <TabsTrigger value="members">Membres</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                    <OrganizationDetailsForm organization={organization} />
                </div>
            </TabsContent>

            <TabsContent value="members" className="space-y-4">
                <div className="rounded-lg border bg-card p-6">
                    <MembersTab
                        members={members}
                        invitations={invitations}
                        organizationId={organizationId}
                        isAdmin={isAdmin}
                    />
                </div>
            </TabsContent>
        </Tabs>
    )
}
