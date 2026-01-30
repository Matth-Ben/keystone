import { redirect } from 'next/navigation'
import { getUserOrganizations } from '@/lib/actions/organizations'
import { OnboardingView } from '@/components/onboarding/onboarding-view'

export default async function OnboardingPage() {
    const organizations = await getUserOrganizations()

    if (organizations.length > 0) {
        redirect('/clients')
    }

    return <OnboardingView />
}
