'use client'

import { useState } from 'react'
import { Plus, Search, Server, Database, Key, FileText, MoreHorizontal, Edit, Trash2, Globe, Folder, Copy, Check, Clock } from 'lucide-react'
import { Secret, SecretType, deleteSecret } from '@/lib/actions/secrets'
import { SecretValue } from './secret-value'
import { CreateSecretDialog } from './create-secret-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
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
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

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

function CopyableText({ text, label, className, icon }: { text: string, label: string, className?: string, icon?: any }) {
    const [copied, setCopied] = useState(false)

    const onCopy = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(text)
        setCopied(true)
        toast.success(`${label} copié !`)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div
            onClick={onCopy}
            className={cn(
                "group flex items-center gap-2 cursor-pointer hover:bg-muted/50 p-1.5 rounded-md transition-all border border-transparent hover:border-border w-full",
                className
            )}
            title={`Copier ${label}`}
        >
            {icon && <span className="text-muted-foreground shrink-0">{icon}</span>}
            <span className="truncate flex-1 font-mono text-sm">{text}</span>
            {copied ? (
                <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
            ) : (
                <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
            )}
        </div>
    )
}

export function SecretList({ secrets, clientId, role = 'restricted' }: SecretListProps) {
    const canWrite = role !== 'restricted'
    const canDelete = role === 'admin'
    const [search, setSearch] = useState('')
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [secretToEdit, setSecretToEdit] = useState<Secret | undefined>(undefined)
    const [secretToDelete, setSecretToDelete] = useState<Secret | undefined>(undefined)

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
            setSecretToDelete(undefined)
        } catch (error) {
            toast.error('Erreur lors de la suppression')
        }
    }

    return (
        <div className="space-y-6">
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
                <div className="flex flex-col gap-4">
                    {filteredSecrets.map((secret) => {
                        const Icon = TYPE_ICONS[secret.type] || FileText
                        return (
                            <Card key={secret.id} className="group relative overflow-hidden transition-all hover:shadow-md">
                                <CardHeader>
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                                                <Icon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-base font-semibold leading-none mb-1.5 flex items-center gap-2">
                                                    {secret.title}
                                                    {!clientId && (
                                                        <Badge variant="outline" className="text-[10px] font-normal h-5 px-1.5 text-muted-foreground">
                                                            {secret.clients?.name || 'Sans client'}
                                                        </Badge>
                                                    )}
                                                </CardTitle>
                                                <Badge variant="secondary" className="font-normal text-xs">
                                                    {TYPE_LABELS[secret.type]}
                                                </Badge>
                                            </div>
                                        </div>
                                        {(canWrite || canDelete) && (
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="-mr-2 h-8 w-8 text-muted-foreground">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {canWrite && (
                                                        <DropdownMenuItem onClick={() => {
                                                            setSecretToEdit(secret)
                                                            setIsCreateOpen(true)
                                                        }}>
                                                            <Edit className="mr-2 h-4 w-4" />
                                                            Modifier
                                                        </DropdownMenuItem>
                                                    )}
                                                    {canDelete && (
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => setSecretToDelete(secret)}
                                                        >
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Supprimer
                                                        </DropdownMenuItem>
                                                    )}
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        )}
                                    </div>
                                </CardHeader>

                                <CardContent>
                                    {(secret.username || secret.host || secret.db_name || secret.url) && (
                                        <div className="bg-secondary/30 rounded-lg p-2 space-y-1">
                                            {secret.username && (
                                                <CopyableText
                                                    text={secret.username}
                                                    label="Nom d'utilisateur"
                                                    icon={<span className="text-[10px] uppercase font-bold w-8">User</span>}
                                                />
                                            )}
                                            {secret.host && (
                                                <div className="flex items-center gap-1">
                                                    <CopyableText
                                                        text={secret.host}
                                                        label="Hôte"
                                                        icon={<span className="text-[10px] uppercase font-bold w-8">Host</span>}
                                                    />
                                                    {secret.port && (
                                                        <span className="text-xs text-muted-foreground px-1">:{secret.port}</span>
                                                    )}
                                                </div>
                                            )}
                                            {secret.db_name && (
                                                <CopyableText
                                                    text={secret.db_name}
                                                    label="Base de données"
                                                    icon={<span className="text-[10px] uppercase font-bold w-8">DB</span>}
                                                />
                                            )}
                                            {secret.url && (
                                                <CopyableText
                                                    text={secret.url}
                                                    label="URL"
                                                    icon={<span className="text-[10px] uppercase font-bold w-8">URL</span>}
                                                />
                                            )}
                                        </div>
                                    )}

                                    {secret.notes && (
                                        <div className="text-xs text-muted-foreground italic px-1 pt-2 line-clamp-2">
                                            "{secret.notes}"
                                        </div>
                                    )}

                                    <div className="pt-2">
                                        <SecretValue secretId={secret.id} />
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
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
