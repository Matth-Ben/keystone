import { AppearanceSettingsForm } from '@/components/settings/appearance-settings-form'

export default function AppearanceSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Apparence</h2>
                <p className="text-muted-foreground">
                    Personnalisez l'apparence et le comportement de l'application
                </p>
            </div>

            <AppearanceSettingsForm />
        </div>
    )
}
