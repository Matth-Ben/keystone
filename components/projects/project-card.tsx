'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal, Star, Trash2, Edit, Folder } from 'lucide-react'
import { Project, deleteProject } from '@/lib/actions/projects'
import { toggleFavorite } from '@/lib/actions/favorites'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface ProjectCardProps {
    project: Project
    isFavorite?: boolean
}

export function ProjectCard({ project, isFavorite = false }: ProjectCardProps) {
    const router = useRouter()
    const [favorite, setFavorite] = useState(isFavorite)

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            setFavorite(!favorite)
            const result = await toggleFavorite('project', project.id)
            if (result.action === 'added') {
                toast.success('Projet ajouté aux favoris')
            } else {
                toast.success('Projet retiré des favoris')
            }
            router.refresh()
        } catch (error) {
            setFavorite(favorite)
            toast.error('Erreur lors de la mise à jour du favori')
        }
    }

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

        try {
            await deleteProject(project.id)
            toast.success('Projet supprimé')
            router.refresh()
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    return (
        <Link
            href={`/projects/${project.id}`}
            className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
        >
            <div className="flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-500/10 text-xl font-bold text-blue-600">
                    <Folder className="h-6 w-6" />
                </div>
                <div className="flex items-center gap-1">
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "h-8 w-8 text-muted-foreground transition-colors hover:text-yellow-400",
                            favorite && "text-yellow-400"
                        )}
                        onClick={handleToggleFavorite}
                    >
                        <Star className={cn("h-4 w-4", favorite && "fill-current")} />
                    </Button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); /* TODO: Edit */ }}>
                                <Edit className="mr-2 h-4 w-4" />
                                Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Supprimer
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <div className="mt-4">
                <h3 className="font-semibold leading-none tracking-tight">{project.name}</h3>
                {project.description && (
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                        {project.description}
                    </p>
                )}
            </div>

            <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                <span>Créé le {new Date(project.created_at).toLocaleDateString()}</span>
            </div>
        </Link>
    )
}
