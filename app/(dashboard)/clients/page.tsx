export default function ClientsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
                <p className="text-muted-foreground">
                    Gérez vos clients et leurs projets
                </p>
            </div>

            <div className="rounded-lg border bg-card p-8 text-center">
                <h2 className="text-xl font-semibold mb-2">Bienvenue sur Keystone ! 🎉</h2>
                <p className="text-muted-foreground mb-4">
                    Le layout et la navigation sont maintenant en place.
                </p>
                <div className="text-sm text-muted-foreground space-y-2">
                    <p>✅ Sidebar avec navigation</p>
                    <p>✅ Sélecteur d'organisation</p>
                    <p>✅ Recherche globale (Cmd+K)</p>
                    <p>✅ Favoris et Récents</p>
                    <p className="mt-4 text-xs">
                        La gestion des clients sera implémentée à l'étape suivante.
                    </p>
                </div>
            </div>
        </div>
    )
}
