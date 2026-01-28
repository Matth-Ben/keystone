'use client'

import { useState } from 'react'
import { Plus, Trash2, Link as LinkIcon, ExternalLink, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { updateClient } from '@/lib/actions/clients'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { LinkDialog } from './link-dialog'

interface Client {
    id: string
    name: string
    website?: string | null
    description?: string | null
    logo?: string | null
    links?: { label: string; url: string }[] | null
}

interface ClientInfoTabProps {
    client: Client
}

export function ClientInfoTab({ client }: ClientInfoTabProps) {
    const [links, setLinks] = useState<{ label: string; url: string }[]>(client.links || [])
    const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false)
    const [editingIndex, setEditingIndex] = useState<number | null>(null)
    const [deleteIndex, setDeleteIndex] = useState<number | null>(null)
    const [isSaving, setIsSaving] = useState(false)

    const handleAddLink = () => {
        setEditingIndex(null)
        setIsLinkDialogOpen(true)
    }

    const handleEditLink = (index: number) => {
        setEditingIndex(index)
        setIsLinkDialogOpen(true)
    }

    const handleSaveLink = async (link: { label: string; url: string }) => {
        setIsSaving(true)
        try {
            let updatedLinks: { label: string; url: string }[]

            if (editingIndex !== null) {
                // Modifier un lien existant
                updatedLinks = [...links]
                updatedLinks[editingIndex] = link
            } else {
                // Ajouter un nouveau lien
                updatedLinks = [...links, link]
            }

            await updateClient(client.id, { links: updatedLinks })
            setLinks(updatedLinks)
            setIsLinkDialogOpen(false)
            toast.success(editingIndex !== null ? 'Lien modifié' : 'Lien ajouté')
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la sauvegarde')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteLink = async () => {
        if (deleteIndex === null) return

        setIsSaving(true)
        try {
            const updatedLinks = links.filter((_, i) => i !== deleteIndex)
            await updateClient(client.id, { links: updatedLinks })
            setLinks(updatedLinks)
            setDeleteIndex(null)
            toast.success('Lien supprimé')
        } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la suppression')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Informations du client */}
            <div className="space-y-4">
                <h3 className="text-lg font-medium">Informations</h3>
                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-sm">{client.name}</p>
                    </div>

                    {client.website && (
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Site web</p>
                            <a
                                href={client.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                            >
                                {client.website}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        </div>
                    )}
                </div>

                {client.description && (
                    <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Description</p>
                        <p className="text-sm text-muted-foreground">{client.description}</p>
                    </div>
                )}
            </div>

            {/* Liens Utiles */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Liens Utiles</h3>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleAddLink}
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Ajouter un lien
                    </Button>
                </div>
                <Separator />

                {links.length === 0 ? (
                    <div className="flex h-32 items-center justify-center rounded-lg border border-dashed">
                        <p className="text-sm text-muted-foreground">Aucun lien configuré</p>
                    </div>
                ) : (
                    <div className="grid gap-2 md:grid-cols-2">
                        {links.map((link, index) => (
                            <div
                                key={index}
                                className="group relative flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                            >
                                <a
                                    href={link.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-3 flex-1 min-w-0"
                                >
                                    <LinkIcon className="h-4 w-4 text-muted-foreground shrink-0" />
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm truncate">{link.label}</p>
                                        <p className="text-xs text-muted-foreground truncate">{link.url}</p>
                                    </div>
                                    <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0" />
                                </a>
                                <div className="flex items-center gap-1">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleEditLink(index)
                                        }}
                                    >
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 text-destructive hover:text-destructive"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            setDeleteIndex(index)
                                        }}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Dialog pour ajouter/modifier un lien */}
            <LinkDialog
                open={isLinkDialogOpen}
                onOpenChange={setIsLinkDialogOpen}
                onSave={handleSaveLink}
                initialData={editingIndex !== null ? links[editingIndex] : undefined}
                isSaving={isSaving}
            />

            {/* Dialog de confirmation de suppression */}
            <AlertDialog open={deleteIndex !== null} onOpenChange={() => setDeleteIndex(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Supprimer ce lien ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action est irréversible. Le lien sera définitivement supprimé.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteLink}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isSaving}
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
