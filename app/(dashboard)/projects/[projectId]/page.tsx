import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MoreHorizontal, Edit, Trash2, Folder, Globe } from 'lucide-react'
import { getProject } from '@/lib/actions/projects'
import { getClient } from '@/lib/actions/clients'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ProjectActions } from '@/components/projects/project-actions'
import { RecentTracker } from '@/components/dashboard/recent-tracker'
import { requireOrgRole } from '@/lib/rbac'

interface PageProps {
    params: Promise<{
        projectId: string
    }>
}

export default async function ProjectPage({ params }: PageProps) {
    try {
        const resolvedParams = await params
        const project = await getProject(resolvedParams.projectId)

        // Parallel : client (fil d'ariane) + rôle utilisateur
        const [client, { role }] = await Promise.all([
            getClient(project.client_id),
            requireOrgRole(project.organization_id),
        ])

        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Link href="/clients" className="hover:text-foreground">
                                Clients
                            </Link>
                            <span>/</span>
                            <Link href={`/clients/${client.id}`} className="hover:text-foreground">
                                {client.name}
                            </Link>
                            <span>/</span>
                            <span className="text-foreground">{project.name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-blue-500/10 text-3xl font-bold text-blue-600">
                                <Folder className="h-8 w-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{project.name}</h1>
                                {project.description && (
                                    <p className="text-sm text-muted-foreground line-clamp-1">
                                        {project.description}
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <RecentTracker type="project" id={project.id} name={project.name} organizationId={project.organization_id} />
                        <ProjectActions project={project} role={role} />
                    </div>
                </div>

                {/* Tabs */}
                <Tabs defaultValue="secrets" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="secrets">Secrets</TabsTrigger>
                        <TabsTrigger value="settings">Paramètres</TabsTrigger>
                    </TabsList>

                    <TabsContent value="secrets">
                        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
                            <p>Gestion des secrets à venir (Étape 6)</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="settings">
                        <div className="flex h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center text-muted-foreground">
                            <p>Paramètres du projet à venir</p>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        )
    } catch (error) {
        notFound()
    }
}
