import { redirect } from 'next/navigation'

/**
 * Page d'accueil - Redirige vers les activités
 * Les utilisateurs non connectés seront redirigés vers /login par le middleware
 */
export default function HomePage() {
  redirect('/mes-activites')
}