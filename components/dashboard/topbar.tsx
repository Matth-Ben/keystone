'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Menu, Search, LogOut, User, Settings, Plus, Sun, Moon } from 'lucide-react'
import { useTheme } from "next-themes"
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAppStore } from '@/lib/store/app-store'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { CreateSecretDialog } from '@/components/secrets/create-secret-dialog'
import { getUserProfile, type UserProfile } from '@/lib/actions/user-actions'

interface TopbarProps {
    onOpenSearch: () => void
}

export function Topbar({ onOpenSearch }: TopbarProps) {
    const { toggleSidebar, userProfile: profile, setUserProfile } = useAppStore()
    const [loading, setLoading] = useState(false)
    const [createSecretOpen, setCreateSecretOpen] = useState(false)
    // Removed local profile state
    const router = useRouter()
    const supabase = createClient()
    const { setTheme } = useTheme()

    useEffect(() => {
        // Always fetch fresh profile on mount to sync store
        getUserProfile().then(setUserProfile).catch(console.error)
    }, [setUserProfile])

    // Raccourci clavier pour créer un secret
    useEffect(() => {
        const down = (e: KeyboardEvent) => {
            if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                setCreateSecretOpen(true)
            }
        }
        document.addEventListener('keydown', down)
        return () => document.removeEventListener('keydown', down)
    }, [])

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

    // Helper to get initials
    const getInitials = () => {
        if (profile?.full_name) {
            return profile.full_name
                .split(' ')
                .map(n => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2)
        }
        return <User className="h-5 w-5" />
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
                className="md:hidden mr-auto"
                onClick={onOpenSearch}
            >
                <Search className="h-5 w-5" />
            </Button>

            <div className="flex items-center gap-2">
                {/* Global Add Secret Button */}
                <Button
                    variant="default"
                    size="sm"
                    className="hidden sm:flex gap-1.5"
                    onClick={() => setCreateSecretOpen(true)}
                    title="Ajouter un secret (⌘J)"
                >
                    <Plus className="h-4 w-4" />
                    <span className="hidden lg:inline">Ajouter un secret</span>
                    <span className="lg:hidden">Ajouter</span>
                    <kbd className="hidden xl:inline-flex pointer-events-none h-5 select-none items-center gap-1 rounded border bg-white/20 px-1.5 font-mono text-[10px] font-medium text-white ml-1 opacity-80">
                        <span className="text-xs">⌘</span>J
                    </kbd>
                </Button>
                {/* Mobile version of add button */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="sm:hidden"
                    onClick={() => setCreateSecretOpen(true)}
                >
                    <Plus className="h-5 w-5" />
                </Button>

                {/* Theme Toggle */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9">
                            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                            <span className="sr-only">Toggle theme</span>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                            Clair
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                            Sombre
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                            Système
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* User menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                {profile?.avatar_url && (
                                    <AvatarImage src={profile.avatar_url} className="object-cover" />
                                )}
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                    {getInitials()}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end">
                        <DropdownMenuLabel>
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none truncate pr-2">{profile?.full_name || 'Mon compte'}</p>
                                <p className="text-xs leading-none text-muted-foreground truncate pr-2">{profile?.email}</p>
                            </div>
                        </DropdownMenuLabel>
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

            <CreateSecretDialog
                open={createSecretOpen}
                onOpenChange={setCreateSecretOpen}
            />
        </div>
    )
}
