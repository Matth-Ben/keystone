import { getUserProfile } from '@/lib/actions/user-actions'
import { GeneralSettingsForm } from '@/components/settings/general-settings-form'

export default async function GeneralSettingsPage() {
    const profile = await getUserProfile()

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-bold tracking-tight">Profil</h2>
                <p className="text-muted-foreground">
                    Gérez vos informations personnelles
                </p>
            </div>

            <GeneralSettingsForm profile={profile} />
        </div>
    )
}
