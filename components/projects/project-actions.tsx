'use client'

import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2, Edit } from 'lucide-react'
import { deleteProject, Project } from '@/lib/actions/projects'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useState } from 'react'

export function ProjectActions({ project }: { project: Project }) {
    const router = useRouter()

    const handleDelete = async () => {
        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

        try {
            await deleteProject(project.id)
            toast.success('Projet supprimé')
            router.push(`/clients/${project.client_id}`)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem>
                    <Edit className="mr-2 h-4 w-4" />
                    Modifier
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Supprimer
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
