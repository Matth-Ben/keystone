'use client'

import { useState } from 'react'
import { Folder } from 'lucide-react'
import { Project } from '@/lib/actions/projects'
import { ProjectCard } from '@/components/projects/project-card'
import { CreateProjectDialog } from '@/components/projects/create-project-dialog'

interface ProjectListProps {
    projects: Project[]
    clientId: string
}

export function ProjectList({ projects: initialProjects, clientId }: ProjectListProps) {
    // Si on voulait faire du fetching client-side ou search, on pourrait utiliser un state
    // Pour l'instant on utilise simplement les données passées en props (server-side fetched)
    // Next.js Server Actions avec revalidatePath s'occupera de mettre à jour la page

    // Note: Dans une vraie app, on pourrait vouloir un search local ici aussi

    if (initialProjects.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed py-12 text-center">
                <div className="rounded-full bg-muted p-4">
                    <Folder className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                    <h3 className="text-lg font-semibold">Aucun projet</h3>
                    <p className="text-sm text-muted-foreground">
                        Ce client n 'a pas encore de projet.
                    </p>
                </div>
                <CreateProjectDialog clientId={clientId} />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <CreateProjectDialog clientId={clientId} />
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {initialProjects.map((project) => (
                    <ProjectCard key={project.id} project={project} />
                ))}
            </div>
        </div>
    )
}
