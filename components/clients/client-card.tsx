'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { MoreHorizontal, Star, Trash2, Edit } from 'lucide-react'
import { Client, deleteClient } from '@/lib/actions/clients'
import { toggleFavorite } from '@/lib/actions/favorites'
import { useAppStore } from '@/lib/store/app-store'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { CreateClientDialog } from './create-client-dialog'

interface ClientCardProps {
    client: Client
}

export function ClientCard({ client }: ClientCardProps) {
    const router = useRouter()
    const { favorites, addFavorite, removeFavorite } = useAppStore()
    const [editOpen, setEditOpen] = useState(false)
    const [deleteOpen, setDeleteOpen] = useState(false)

    // Vérifier si le client est dans les favoris du store
    const isFavorite = favorites.some(f => f.resource_type === 'client' && f.resource_id === client.id)
    const favoriteId = favorites.find(f => f.resource_type === 'client' && f.resource_id === client.id)?.id

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        try {
            if (isFavorite) {
                // Optimistic update
                if (favoriteId) removeFavorite(favoriteId)

                const result = await toggleFavorite('client', client.id)
                if (result.action === 'removed') {
                    toast.success('Retiré des favoris')
                    // Si l'id a changé entre temps (peu probable), on s'assure qu'il est bien supprimé
                    if (result.id) removeFavorite(result.id)
                }
            } else {
                // Optimistic impossible sans ID, on attend
                const result = await toggleFavorite('client', client.id)
                if (result.action === 'added') {
                    toast.success('Ajouté aux favoris')
                    addFavorite({
                        id: result.id,
                        resource_type: 'client',
                        resource_id: client.id,
                        resource_name: client.name
                    })
                }
            }
            // Router refresh pour revalider les données serveur si besoin, mais le store est à jour
            router.refresh()
        } catch (error) {
            toast.error('Erreur lors de la mise à jour du favori')
        }
    }

    const handleDelete = async () => {
        try {
            await deleteClient(client.id)
            toast.success('Client supprimé')
            router.refresh()
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    return (
        <>
            <Link
                href={`/clients/${client.id}`}
                className="group relative flex flex-col justify-between rounded-xl border bg-card p-6 shadow-sm transition-all hover:shadow-md"
            >
                <div className="flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 text-xl font-bold text-primary overflow-hidden">
                        {client.logo ? (
                            <img src={client.logo} alt={client.name} className="h-full w-full object-cover" />
                        ) : client.website ? (
                            <img
                                src={`https://www.google.com/s2/favicons?domain=${client.website}&sz=64`}
                                alt={client.name}
                                className="h-8 w-8 object-contain"
                            />
                        ) : (
                            client.name.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                                "h-8 w-8 text-muted-foreground transition-colors hover:text-yellow-400",
                                isFavorite && "text-yellow-400"
                            )}
                            onClick={handleToggleFavorite}
                        >
                            <Star className={cn("h-4 w-4", isFavorite && "fill-current")} />
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setEditOpen(true);
                                }}>
                                    <Edit className="mr-2 h-4 w-4" />
                                    Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setDeleteOpen(true);
                                    }}
                                    className="text-destructive"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Supprimer
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="mt-4">
                    <h3 className="font-semibold leading-none tracking-tight">{client.name}</h3>
                    {client.website && (
                        <p className="mt-2 text-sm text-muted-foreground truncate">
                            {client.website}
                        </p>
                    )}
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Créé le {new Date(client.created_at).toLocaleDateString()}</span>
                </div>
            </Link>

            <CreateClientDialog
                open={editOpen}
                onOpenChange={setEditOpen}
                clientToEdit={client}
                onClientCreated={() => router.refresh()}
            />

            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Elle supprimera définitivement ce client et tous ses projets associés.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={(e) => { e.stopPropagation(); }}>Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={(e) => { e.stopPropagation(); handleDelete(); }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
