import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface Organization {
    id: string
    name: string
    slug: string
    role: 'admin' | 'member' | 'restricted'
}

interface Favorite {
    id: string
    resource_type: 'client' | 'project'
    resource_id: string
    resource_name: string
}

interface Recent {
    type: 'client' | 'project'
    id: string
    name: string
    timestamp: number
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
    clearRecents: () => void

    // Sidebar state (mobile)
    sidebarOpen: boolean
    setSidebarOpen: (open: boolean) => void
    toggleSidebar: () => void
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
            clearRecents: () => set({ recents: [] }),

            // Sidebar
            sidebarOpen: false,
            setSidebarOpen: (open) => set({ sidebarOpen: open }),
            toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
        }),
        {
            name: 'keystone-app-storage',
            partialize: (state) => ({
                currentOrganization: state.currentOrganization,
                recents: state.recents,
            }),
        }
    )
)

export type { Organization, Favorite, Recent }
