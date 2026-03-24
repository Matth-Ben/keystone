'use client'

import { useState } from 'react'
import { Plus, Search, Server, Database, Key, FileText, Globe, Folder } from 'lucide-react'
import { Secret, SecretType, deleteSecret } from '@/lib/actions/secrets'
import { CreateSecretDialog } from './create-secret-dialog'
import { SecretDetailPanel } from './secret-detail-panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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

import type { OrgRole } from '@/lib/rbac'

interface SecretListProps {
    secrets: (Secret & { clients?: { name: string } | null })[]
    clientId?: string
    role?: OrgRole
}

export const TYPE_ICONS: Record<SecretType, any> = {
    db: Database,
    ssh: Server,
    ftp: Folder,
    cms: Globe,
    api: Key,
    other: FileText
}

export const TYPE_LABELS: Record<SecretType, string> = {
    db: 'Base de données',
    ssh: 'Serveur (SSH)',
    ftp: 'FTP / SFTP',
    cms: 'CMS',
    api: 'API Key',
    other: 'Autre'
}

export function SecretList({ secrets, clientId, role = 'restricted' }: SecretListProps) {
    const canWrite = role !== 'restricted'
    const canDelete = role === 'admin'
    const [search, setSearch] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [secretToEdit, setSecretToEdit] = useState<Secret | undefined>(undefined)
    const [secretToDelete, setSecretToDelete] = useState<Secret | undefined>(undefined)
    const [selectedSecret, setSelectedSecret] = useState<(Secret & { clients?: { name: string } | null }) | null>(null)

    const filteredSecrets = secrets.filter(secret => {
        const terms = search.toLowerCase().split(/\s+/).filter(t => t.length > 0)
        if (terms.length === 0) return true

        const clientName = secret.clients?.name?.toLowerCase() || ''
        const typeLabel = TYPE_LABELS[secret.type]?.toLowerCase() || ''

        // Construire une chaîne complète de recherche pour cet élément
        const searchableContent = [
            secret.title,
            clientName,
            secret.username,
            secret.host,
            secret.db_name,
            secret.url,
            secret.notes,
            typeLabel
        ].filter(Boolean).join(' ').toLowerCase()

        // Vérifier que CHAQUE terme de recherche est présent dans le contenu
        return terms.every(term => searchableContent.includes(term))
    })

    const handleDelete = async () => {
        if (!secretToDelete) return
        try {
            await deleteSecret(secretToDelete.id, clientId || secretToDelete.client_id)
            toast.success('Secret supprimé')
            // Fermer le panel si le secret supprimé était sélectionné
            if (selectedSecret?.id === secretToDelete.id) {
                setSelectedSecret(null)
            }
            setSecretToDelete(undefined)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    const handleSecretClick = (secret: Secret & { clients?: { name: string } | null }) => {
        setSelectedSecret(secret)
    }

    const handleClosePanel = () => {
        setSelectedSecret(null)
    }

    const handleEditFromPanel = () => {
        if (selectedSecret) {
            setSecretToEdit(selectedSecret)
            setIsCreateOpen(true)
        }
    }

    const handleDeleteFromPanel = () => {
        if (selectedSecret) {
            setSecretToDelete(selectedSecret)
        }
    }

    return (
        <div className="flex gap-6">
            {/* Liste des secrets */}
            <div className={cn(
                "flex-1 space-y-6 transition-all",
                selectedSecret && "max-w-[calc(100%-400px)]"
            )}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="relative w-full sm:max-w-md">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher des secrets, clients..."
                            className="pl-9"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    {canWrite && (
                        <Button onClick={() => {
                            setSecretToEdit(undefined)
                            setIsCreateOpen(true)
                        }} size="sm" className="w-full sm:w-auto gap-1.5">
                            <Plus className="h-4 w-4" />
                            Nouveau Secret
                        </Button>
                    )}
                </div>

                {filteredSecrets.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-center">
                        <div className="rounded-full bg-secondary p-4 mb-4">
                            <Key className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <h3 className="text-lg font-semibold">Aucun secret trouvé</h3>
                        <p className="text-muted-foreground text-sm max-w-sm mt-2">
                            {search ? "Essayez de modifier votre recherche." : "Commencez par ajouter votre premier secret sécurisé."}
                        </p>
                        {!search && canWrite && (
                            <Button variant="outline" className="mt-4" onClick={() => setIsCreateOpen(true)}>
                                Créer un secret
                            </Button>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-2">
                        {filteredSecrets.map((secret) => {
                            const Icon = TYPE_ICONS[secret.type] || FileText
                            const isSelected = selectedSecret?.id === secret.id
                            return (
                                <div
                                    key={secret.id}
                                    onClick={() => handleSecretClick(secret)}
                                    className={cn(
                                        "group flex items-center justify-between rounded-lg border bg-card p-3 transition-all cursor-pointer",
                                        isSelected
                                            ? "border-primary bg-primary/5 shadow-md"
                                            : "hover:shadow-md hover:border-primary/20"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "rounded-lg p-2",
                                            isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                                        )}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{secret.title}</span>
                                            {!clientId && secret.clients?.name && (
                                                <span className="text-sm text-muted-foreground">
                                                    — {secret.clients.name}
                                                </span>
                                            )}
                                            {!clientId && !secret.clients?.name && (
                                                <span className="text-sm text-muted-foreground/60 italic">
                                                    — Personnel
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Panel de détails */}
            {selectedSecret && (
                <div className="w-[400px] shrink-0 rounded-lg border bg-card overflow-hidden">
                    <SecretDetailPanel
                        secret={selectedSecret}
                        onClose={handleClosePanel}
                        onEdit={handleEditFromPanel}
                        onDelete={handleDeleteFromPanel}
                        canWrite={canWrite}
                        canDelete={canDelete}
                    />
                </div>
            )}

            <CreateSecretDialog
                open={isCreateOpen}
                onOpenChange={setIsCreateOpen}
                clientId={clientId}
                secretToEdit={secretToEdit}
            />

            <AlertDialog open={!!secretToDelete} onOpenChange={(open) => !open && setSecretToDelete(undefined)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Cette action supprimera définitivement le secret "{secretToDelete?.title}".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
