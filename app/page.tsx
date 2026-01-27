import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserOrganizations } from '@/lib/actions/organizations'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Si l'utilisateur est connecté, vérifier s'il a des organisations
  if (user) {
    try {
      const organizations = await getUserOrganizations()

      // Si pas d'organisation, rediriger vers onboarding
      if (organizations.length === 0) {
        redirect('/onboarding')
      }

      // Sinon, rediriger vers secrets
      redirect('/secrets')
    } catch (error) {
      // En cas d'erreur, rediriger vers secrets
      redirect('/secrets')
    }
  }

  // Sinon, rediriger vers la page de connexion
  redirect('/login')
}
