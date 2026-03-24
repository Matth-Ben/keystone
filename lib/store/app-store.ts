import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Organization {
    id: string
    name: string
    slug: string
    logo_url?: string | null
    brand_color?: string | null
    role: 'admin' | 'member' | 'restricted'
}

interface Favorite {
    id: string
    resource_type: 'client' | 'project'
    resource_id: string
    resource_name: string
    organization_id: string | null
}

interface Recent {
    type: 'client' | 'project'
    id: string
    name: string
    timestamp: number
    organizationId?: string | null
}

interface UserProfile {
    id: string
    email: string
    full_name: string | null
    avatar_url: string | null
}

interface AppStore {
    // Organisation active
    currentOrganization: Organization | null
    setCurrentOrganization: (org: Organization | null) => void

    // Favoris
    favorites: Favorite[]
    setFavorites: (favorites: Favorite[]) => void
    addFavorite: (favorite: Favorite) => void
    removeFavorite: (id: string) => void

    // Récents (max 10 items)
    recents: Recent[]
    addRecent: (item: Recent) => void
    removeRecent: (type: string, id: string) => void
    clearRecents: () => void

    // Sidebar state (mobile)
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    toggleSidebar: () => void

    // User Profile
    userProfile: UserProfile | null
    setUserProfile: (profile: UserProfile | null) => void
}

export const useAppStore = create<AppStore>()(
    persist(
        (set) => ({
            // Organisation
            currentOrganization: null,
            setCurrentOrganization: (org) => set({ currentOrganization: org }),

            // Favoris
            favorites: [],
            setFavorites: (favorites) => set({ favorites }),
            addFavorite: (favorite) =>
                set((state) => ({
                    favorites: [...state.favorites, favorite],
                })),
            removeFavorite: (id) =>
                set((state) => ({
                    favorites: state.favorites.filter((f) => f.id !== id),
                })),

            // Récents
            recents: [],
            addRecent: (item) =>
                set((state) => {
                    // Retirer l'item s'il existe déjà
                    const filtered = state.recents.filter(
                        (r) => !(r.type === item.type && r.id === item.id)
                    )
                    // Ajouter le nouvel item au début
                    const newRecents = [item, ...filtered]
                    // Limiter à 10 items
                    return { recents: newRecents.slice(0, 10) }
                }),
            removeRecent: (type, id) =>
                set((state) => ({
                    recents: state.recents.filter((r) => !(r.type === type && r.id === id)),
                })),
            clearRecents: () => set({ recents: [] }),

            // Sidebar
            sidebarOpen: false,
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

            // User Profile
            userProfile: null,
            setUserProfile: (profile) => set({ userProfile: profile }),
        }),
        {
            name: 'keystone-app-storage',
            partialize: (state) => ({
                currentOrganization: state.currentOrganization,
                recents: state.recents,
                userProfile: state.userProfile,
            }),
        }
    )
)

export type { Organization, Favorite, Recent, UserProfile }
