'use client'

import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { useAppStore } from '@/lib/store/app-store'
import { getOrganizationMembers, updateMemberRole, removeMember } from '@/lib/actions/members'
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
import { Button } from '@/components/ui/button'
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

export function MembersTab() {
    const { currentOrganization } = useAppStore()
    const [members, setMembers] = useState<Member[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (currentOrganization) {
            loadMembers()
        } else {
            setLoading(false)
        }
    }, [currentOrganization])

    const loadMembers = async () => {
        if (!currentOrganization) return

        setLoading(true)
        try {
            const data = await getOrganizationMembers(currentOrganization.id)
            setMembers(data)
        } catch (error: any) {
            console.error('Error loading members:', error)
            toast.error('Erreur', {
                description: error.message || 'Impossible de charger les membres',
            })
        } finally {
            setLoading(false)
        }
    }

    const handleRoleChange = async (memberId: string, newRole: 'admin' | 'member' | 'restricted') => {
        try {
            await updateMemberRole(memberId, newRole)
            toast.success('Rôle mis à jour')
            loadMembers()
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de modifier le rôle',
            })
        }
    }

    const handleRemoveMember = async (memberId: string, memberEmail: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir retirer ${memberEmail} de l'organisation ?`)) {
            return
        }

        try {
            await removeMember(memberId)
            toast.success('Membre retiré')
            loadMembers()
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de retirer le membre',
            })
        }
    }

    const getRoleBadgeVariant = (role: string) => {
        switch (role) {
            case 'admin':
                return 'default'
            case 'member':
                return 'secondary'
            case 'restricted':
                return 'outline'
            default:
                return 'secondary'
        }
    }

    const getRoleLabel = (role: string) => {
        switch (role) {
            case 'admin':
                return 'Admin'
            case 'member':
                return 'Membre'
            case 'restricted':
                return 'Restreint'
            default:
                return role
        }
    }

    const isAdmin = currentOrganization?.role === 'admin'

    if (!currentOrganization) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">
                    Sélectionnez une organisation pour voir les membres
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">Chargement...</div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold">Membres de l'organisation</h3>
                    <p className="text-sm text-muted-foreground">
                        Gérez les membres et leurs permissions
                    </p>
                </div>
            </div>

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Membre</TableHead>
                            <TableHead>Rôle</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center text-muted-foreground">
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
                                                onValueChange={(value) =>
                                                    handleRoleChange(member.id, value as any)
                                                }
                                            >
                                                <SelectTrigger className="w-[140px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="admin">Admin</SelectItem>
                                                    <SelectItem value="member">Membre</SelectItem>
                                                    <SelectItem value="restricted">Restreint</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        ) : (
                                            <Badge variant={getRoleBadgeVariant(member.role)}>
                                                {getRoleLabel(member.role)}
                                            </Badge>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        {isAdmin && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemoveMember(member.id, member.email)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        )}
                                    </TableCell>
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
    )
}
