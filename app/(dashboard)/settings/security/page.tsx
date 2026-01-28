import { SecuritySettingsForm } from '@/components/settings/security-settings-form'

export default function SecuritySettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Sécurité</h2>
                <p className="text-muted-foreground">
                    Gérez votre mot de passe et vos paramètres de sécurité
                </p>
            </div>

            <SecuritySettingsForm />
        </div>
    )
}
