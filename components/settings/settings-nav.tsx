'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Shield, Palette } from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNavItems = [
    {
        title: 'Général',
        href: '/settings',
        icon: User,
        description: 'Profil et informations personnelles'
    },
    {
        title: 'Sécurité',
        href: '/settings/security',
        icon: Shield,
        description: 'Mot de passe et authentification'
    },
    {
        title: 'Apparence',
        href: '/settings/appearance',
        icon: Palette,
        description: 'Préférences d\'affichage'
    }
]

interface SettingsNavItemProps {
    item: typeof settingsNavItems[0]
}

function SettingsNavItem({ item }: SettingsNavItemProps) {
    const pathname = usePathname()
    const isActive = pathname === item.href

    return (
        <Link
            href={item.href}
            className={cn(
                "flex items-start gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                    ? "bg-accent text-accent-foreground"
                    : "hover:bg-accent/50"
            )}
        >
            <item.icon className="h-5 w-5 mt-0.5" />
            <div className="flex-1">
                <div className="font-medium">{item.title}</div>
                <div className="text-xs text-muted-foreground hidden sm:block">
                    {item.description}
                </div>
            </div>
        </Link>
    )
}

export function SettingsNav() {
    return (
        <nav className="space-y-1">
            {settingsNavItems.map((item) => (
                <SettingsNavItem key={item.href} item={item} />
            ))}
        </nav>
    )
}
