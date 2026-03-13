'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, UserPlus, Copy, Check, Clock, Mail } from 'lucide-react'
import { updateMemberRole, removeMember, inviteMember, cancelInvitation } from '@/lib/actions/members'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

interface Member {
    id: string
    user_id: string
    role: 'admin' | 'member' | 'restricted'
    email: string
    full_name: string | null
    created_at: string
}

interface Invitation {
    id: string
    email: string
    role: string
    created_at: string
    expires_at: string
}

interface MembersTabProps {
    members: Member[]
    invitations: Invitation[]
    organizationId: string
    isAdmin: boolean
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Admin',
    member: 'Éditeur',
    restricted: 'Lecteur',
}

const ROLE_BADGE_VARIANTS: Record<string, 'default' | 'secondary' | 'outline'> = {
    admin: 'default',
    member: 'secondary',
    restricted: 'outline',
}

export function MembersTab({ members, invitations, organizationId, isAdmin }: MembersTabProps) {
    const router = useRouter()

    // Invite dialog state
    const [inviteOpen, setInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'restricted'>('member')
    const [inviteLoading, setInviteLoading] = useState(false)
    const [inviteUrl, setInviteUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'restricted') => {
        try {
            await updateMemberRole(memberId, newRole)
            toast.success('Rôle mis à jour')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Impossible de modifier le rôle')
        }
    }

    const handleRemoveMember = async (memberId: string, memberEmail: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberEmail} de l'organisation ?`)) return
        try {
            await removeMember(memberId)
            toast.success('Membre retiré')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Impossible de retirer le membre')
        }
    }

    const handleInvite = async () => {
        if (!inviteEmail.trim()) return
        setInviteLoading(true)
        try {
            const { inviteUrl: url } = await inviteMember(organizationId, inviteEmail.trim(), inviteRole)
            setInviteUrl(url)
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Impossible d\'envoyer l\'invitation')
        } finally {
            setInviteLoading(false)
        }
    }

    const handleCopyInviteUrl = () => {
        if (!inviteUrl) return
        navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        toast.success('Lien copié !')
        setTimeout(() => setCopied(false), 2000)
    }

    const handleCloseInviteDialog = () => {
        setInviteOpen(false)
        setInviteEmail('')
        setInviteRole('member')
        setInviteUrl(null)
        setCopied(false)
    }

    const handleCancelInvitation = async (invitationId: string, email: string) => {
        if (!confirm(`Annuler l'invitation envoyée à ${email} ?`)) return
        try {
            await cancelInvitation(invitationId)
            toast.success('Invitation annulée')
            router.refresh()
        } catch (error: any) {
            toast.error(error.message || 'Impossible d\'annuler l\'invitation')
        }
    }

    return (
        <div className="space-y-8">
            {/* Liste des membres */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-base font-semibold">Membres actifs</h3>
                        <p className="text-sm text-muted-foreground">{members.length} membre{members.length > 1 ? 's' : ''}</p>
                    </div>
                    {isAdmin && (
                        <Button size="sm" onClick={() => setInviteOpen(true)} className="gap-2">
                            <UserPlus className="h-4 w-4" />
                            Inviter
                        </Button>
                    )}
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Membre</TableHead>
                                <TableHead>Rôle</TableHead>
                                {isAdmin && <TableHead className="w-[60px]" />}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {members.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={isAdmin ? 3 : 2} className="text-center text-muted-foreground py-8">
                                        Aucun membre
                                    </TableCell>
                                </TableRow>
                            ) : (
                                members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div>
                                                <div className="font-medium">{member.full_name || member.email}</div>
                                                {member.full_name && (
                                                    <div className="text-sm text-muted-foreground">{member.email}</div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {isAdmin ? (
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) => handleRoleChange(member.id, value as any)}
                                                >
                                                    <SelectTrigger className="w-[130px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="admin">Admin</SelectItem>
                                                        <SelectItem value="member">Éditeur</SelectItem>
                                                        <SelectItem value="restricted">Lecteur</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            ) : (
                                                <Badge variant={ROLE_BADGE_VARIANTS[member.role]}>
                                                    {ROLE_LABELS[member.role]}
                                                </Badge>
                                            )}
                                        </TableCell>
                                        {isAdmin && (
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleRemoveMember(member.id, member.email)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {!isAdmin && (
                    <p className="text-sm text-muted-foreground">
                        Seuls les administrateurs peuvent gérer les membres.
                    </p>
                )}
            </div>

            {/* Invitations en attente (admin uniquement) */}
            {isAdmin && invitations.length > 0 && (
                <div className="space-y-4">
                    <div>
                        <h3 className="text-base font-semibold">Invitations en attente</h3>
                        <p className="text-sm text-muted-foreground">
                            Ces invitations expirent dans 7 jours.
                        </p>
                    </div>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Rôle</TableHead>
                                    <TableHead>Expire le</TableHead>
                                    <TableHead className="w-[60px]" />
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {invitations.map((inv) => (
                                    <TableRow key={inv.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
                                                <span className="text-sm">{inv.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={ROLE_BADGE_VARIANTS[inv.role] || 'secondary'}>
                                                {ROLE_LABELS[inv.role] || inv.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                                                <Clock className="h-3.5 w-3.5" />
                                                {new Date(inv.expires_at).toLocaleDateString('fr-FR')}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleCancelInvitation(inv.id, inv.email)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            )}

            {/* Dialog d'invitation */}
            <Dialog open={inviteOpen} onOpenChange={(open) => !open && handleCloseInviteDialog()}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Inviter un membre</DialogTitle>
                        <DialogDescription>
                            {inviteUrl
                                ? 'Partagez ce lien avec la personne à inviter. Il expire dans 7 jours.'
                                : 'Entrez l\'adresse email et choisissez un rôle.'}
                        </DialogDescription>
                    </DialogHeader>

                    {!inviteUrl ? (
                        <div className="space-y-4 py-2">
                            <div className="space-y-2">
                                <Label htmlFor="invite-email">Email</Label>
                                <Input
                                    id="invite-email"
                                    type="email"
                                    placeholder="collaborateur@exemple.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="invite-role">Rôle</Label>
                                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as any)}>
                                    <SelectTrigger id="invite-role">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="admin">
                                            <div>
                                                <div className="font-medium">Admin</div>
                                                <div className="text-xs text-muted-foreground">Accès complet, gestion des membres</div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="member">
                                            <div>
                                                <div className="font-medium">Éditeur</div>
                                                <div className="text-xs text-muted-foreground">Lecture et écriture, pas de suppression</div>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="restricted">
                                            <div>
                                                <div className="font-medium">Lecteur</div>
                                                <div className="text-xs text-muted-foreground">Lecture seule, ne peut pas révéler les secrets</div>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    ) : (
                        <div className="py-2">
                            <div className="flex items-center gap-2 rounded-md border bg-muted/50 p-3">
                                <span className="flex-1 truncate font-mono text-sm text-muted-foreground">
                                    {inviteUrl}
                                </span>
                                <Button variant="ghost" size="icon" onClick={handleCopyInviteUrl} className="shrink-0">
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {!inviteUrl ? (
                            <>
                                <Button variant="outline" onClick={handleCloseInviteDialog}>
                                    Annuler
                                </Button>
                                <Button onClick={handleInvite} disabled={!inviteEmail.trim() || inviteLoading}>
                                    {inviteLoading ? 'Création...' : 'Générer le lien'}
                                </Button>
                            </>
                        ) : (
                            <Button onClick={handleCloseInviteDialog}>Fermer</Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
