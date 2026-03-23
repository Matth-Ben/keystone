'use client'

import { useState, useEffect } from 'react'
import { Eye, EyeOff, Copy, Edit, Check, Loader2 } from 'lucide-react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { revealSecret, getSecretDetails, Secret } from '@/lib/actions/secrets'
import { CreateSecretDialog } from './create-secret-dialog'

interface ViewSecretDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    secretId: string | null
}

export function ViewSecretDialog({
    open,
    onOpenChange,
    secretId,
}: ViewSecretDialogProps) {
    const [secret, setSecret] = useState<Secret | null>(null)
    const [loading, setLoading] = useState(false)
    // decryptedPassword stores the actual cleartext password once fetched
    const [decryptedPassword, setDecryptedPassword] = useState<string | null>(null)
    // showPassword controls whether the input type is "text" or "password"
    const [showPassword, setShowPassword] = useState(false)

    const [editOpen, setEditOpen] = useState(false)
    const [copiedField, setCopiedField] = useState<string | null>(null)
    const [copyingPassword, setCopyingPassword] = useState(false)

    useEffect(() => {
        if (open && secretId) {
            setLoading(true)
            setDecryptedPassword(null)
            setShowPassword(false)

            getSecretDetails(secretId)
                .then(data => {
                    setSecret(data)
                    // Prefetch password immediately
                    revealSecret(secretId)
                        .then(pwd => setDecryptedPassword(pwd))
                        .catch(console.error)
                })
                .catch((err) => {
                    toast.error("Impossible de charger le secret")
                    onOpenChange(false)
                })
                .finally(() => setLoading(false))
        }
    }, [open, secretId, onOpenChange])

    const handleCopy = (text: string, fieldName: string) => {
        navigator.clipboard.writeText(text)
        setCopiedField(fieldName)
        toast.success("Copié !")
        setTimeout(() => setCopiedField(null), 2000)
    }

    const handleCopyPassword = async () => {
        if (!secret) return

        try {
            setCopyingPassword(true)
            const pwd = decryptedPassword || await revealSecret(secret.id)
            if (!decryptedPassword) setDecryptedPassword(pwd)

            await navigator.clipboard.writeText(pwd)
            setCopiedField('password')
            toast.success("Mot de passe copié !")
            setTimeout(() => setCopiedField(null), 2000)
        } catch (error) {
            toast.error("Erreur lors de la copie")
        } finally {
            setCopyingPassword(false)
        }
    }

    const toggleShowPassword = () => {
        setShowPassword(!showPassword)
    }

    const handleEdit = () => {
        setEditOpen(true)
    }

    const onEditOpenChange = (open: boolean) => {
        setEditOpen(open)
        if (!open && secretId) {
            getSecretDetails(secretId).then(setSecret)
        }
    }

    if (!secret && loading) {
        return (
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent>
                    <DialogHeader className="sr-only">
                        <DialogTitle>Chargement du secret</DialogTitle>
                    </DialogHeader>
                    <div className="flex items-center justify-center p-8">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                </DialogContent>
            </Dialog>
        )
    }

    if (!secret) return null

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{secret.title}</DialogTitle>
                        <DialogDescription>
                            Détails du secret ({secret.type})
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Host / URL */}
                        {(secret.host || secret.url) && (
                            <div className="space-y-2">
                                <Label>{secret.url ? 'URL' : 'Hôte'}</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={secret.url || secret.host || ''} />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy(secret.url || secret.host || '', 'host')}
                                    >
                                        {copiedField === 'host' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Username */}
                        {secret.username && (
                            <div className="space-y-2">
                                <Label>Identifiant / User</Label>
                                <div className="flex gap-2">
                                    <Input readOnly value={secret.username} />
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => handleCopy(secret.username!, 'username')}
                                    >
                                        {copiedField === 'username' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Password */}
                        <div className="space-y-2">
                            <Label>Mot de passe / Clé</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        readOnly
                                        type={showPassword ? "text" : "password"}
                                        value={decryptedPassword || ""}
                                        placeholder={!decryptedPassword ? "Déchiffrement..." : ""}
                                    />
                                </div>
                                {!showPassword ? (
                                    <Button
                                        variant="outline"
                                        onClick={toggleShowPassword}
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={toggleShowPassword}
                                    >
                                        <EyeOff className="h-4 w-4" />
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    size="icon"
                                    disabled={copyingPassword && !decryptedPassword}
                                    onClick={handleCopyPassword}
                                >
                                    {copyingPassword ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        copiedField === 'password' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Notes */}
                        {secret.notes && (
                            <div className="space-y-2">
                                <Label>Notes</Label>
                                <div className="rounded-md bg-muted p-3 text-sm">
                                    {secret.notes}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter className="sm:justify-between">
                        <Button variant="ghost" onClick={() => onOpenChange(false)}>
                            Fermer
                        </Button>
                        <Button onClick={handleEdit}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editOpen && (
                <CreateSecretDialog
                    open={editOpen}
                    onOpenChange={onEditOpenChange}
                    secretToEdit={secret}
                    clientId={secret.client_id ?? undefined}
                />
            )}
        </>
    )
}
