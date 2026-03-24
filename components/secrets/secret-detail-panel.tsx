'use client'

import { X, Copy, Check, Edit, Trash2, Server, Database, Key, FileText, Globe, Folder, Settings } from 'lucide-react'
import { Secret, SecretType } from '@/lib/actions/secrets'
import { SecretValue } from './secret-value'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const TYPE_ICONS: Record<SecretType, any> = {
    db: Database,
    ssh: Server,
    ftp: Folder,
    cms: Globe,
    api: Key,
    other: FileText
}

const TYPE_LABELS: Record<SecretType, string> = {
    db: 'Base de données',
    ssh: 'Serveur (SSH)',
    ftp: 'FTP / SFTP',
    cms: 'CMS',
    api: 'API Key',
    other: 'Autre'
}

interface SecretDetailPanelProps {
    secret: Secret & { clients?: { name: string } | null }
    onClose: () => void
    onEdit: () => void
    onDelete: () => void
    canWrite: boolean
    canDelete: boolean
}

function CopyableField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
    const [copied, setCopied] = useState(false)

    const handleCopy = () => {
        navigator.clipboard.writeText(value)
        setCopied(true)
        toast.success(`${label} copié`)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                {label}
            </label>
            <div
                onClick={handleCopy}
                className={cn(
                    "flex items-center justify-between gap-2 p-2 rounded-md bg-muted/50 cursor-pointer hover:bg-muted transition-colors group",
                    mono && "font-mono"
                )}
            >
                <span className="text-sm truncate">{value}</span>
                {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                )}
            </div>
        </div>
    )
}

export function SecretDetailPanel({
    secret,
    onClose,
    onEdit,
    onDelete,
    canWrite,
    canDelete
}: SecretDetailPanelProps) {
    const Icon = TYPE_ICONS[secret.type] || FileText

    return (
        <div className="flex flex-col h-full border-l bg-background">
            {/* Header */}
            <div className="flex items-start justify-between p-4 border-b">
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 p-2.5 text-primary">
                        <Icon className="h-5 w-5" />
                    </div>
                    <div>
                        <h2 className="font-semibold">{secret.title}</h2>
                        <Badge variant="secondary" className="mt-1 font-normal text-xs">
                            {TYPE_LABELS[secret.type]}
                        </Badge>
                    </div>
                </div>
                <div className="flex items-center gap-1 -mr-2 -mt-1">
                    {(canWrite || canDelete) && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Settings className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                {canWrite && (
                                    <DropdownMenuItem onClick={onEdit}>
                                        <Edit className="mr-2 h-4 w-4" />
                                        Modifier
                                    </DropdownMenuItem>
                                )}
                                {canDelete && (
                                    <DropdownMenuItem
                                        className="text-destructive focus:text-destructive"
                                        onClick={onDelete}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Client */}
                {secret.clients?.name && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Client
                        </label>
                        <p className="text-sm">{secret.clients.name}</p>
                    </div>
                )}

                {!secret.clients?.name && !secret.organization_id && (
                    <div className="space-y-1">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            Type
                        </label>
                        <p className="text-sm text-muted-foreground italic">Secret personnel</p>
                    </div>
                )}

                <Separator />

                {/* Credentials */}
                <div className="space-y-3">
                    {secret.username && (
                        <CopyableField label="Utilisateur" value={secret.username} />
                    )}

                    {secret.host && (
                        <CopyableField
                            label="Hôte"
                            value={secret.port ? `${secret.host}:${secret.port}` : secret.host}
                            mono
                        />
                    )}

                    {secret.db_name && (
                        <CopyableField label="Base de données" value={secret.db_name} mono />
                    )}

                    {secret.url && (
                        <CopyableField label="URL" value={secret.url} mono />
                    )}
                </div>

                <Separator />

                {/* Password */}
                <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Mot de passe / Clé
                    </label>
                    <SecretValue key={secret.id} secretId={secret.id} />
                </div>

                {/* Notes */}
                {secret.notes && (
                    <>
                        <Separator />
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Notes
                            </label>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                {secret.notes}
                            </p>
                        </div>
                    </>
                )}
            </div>

        </div>
    )
}
