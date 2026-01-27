import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function Home() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Si l'utilisateur est connecté, rediriger vers le dashboard
  if (user) {
    redirect('/clients')
  }

  // Sinon, rediriger vers la page de connexion
  redirect('/login')
}
