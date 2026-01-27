'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, LogOut, User, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface TopbarProps {
    onOpenSearch: () => void
}

export function Topbar({ onOpenSearch }: TopbarProps) {
    const { toggleSidebar } = useAppStore()
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        setLoading(true)
        try {
            await supabase.auth.signOut()
            toast.success('Déconnexion réussie')
            router.push('/login')
            router.refresh()
        } catch (error: any) {
            toast.error('Erreur', {
                description: error.message || 'Impossible de se déconnecter',
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex h-16 items-center justify-between border-b bg-background px-6">
            {/* Mobile menu button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={toggleSidebar}
            >
                <Menu className="h-5 w-5" />
            </Button>

            {/* Search button */}
            <Button
                variant="outline"
                className="hidden md:flex w-64 justify-start text-muted-foreground"
                onClick={onOpenSearch}
            >
                <Search className="mr-2 h-4 w-4" />
                <span>Rechercher...</span>
                <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                    <span className="text-xs">⌘</span>K
                </kbd>
            </Button>

            {/* Mobile search button */}
            <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={onOpenSearch}
            >
                <Search className="h-5 w-5" />
            </Button>

            {/* User menu */}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarFallback className="bg-primary text-primary-foreground">
                                <User className="h-5 w-5" />
                            </AvatarFallback>
                        </Avatar>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                        <Settings className="mr-2 h-4 w-4" />
                        Paramètres
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} disabled={loading}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {loading ? 'Déconnexion...' : 'Se déconnecter'}
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}
