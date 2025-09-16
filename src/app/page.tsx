import { redirect } from 'next/navigation'

/**
 * Page d'accueil - Redirige vers le dashboard
 * Les utilisateurs non connectés seront redirigés vers /login par le middleware
 */
export default function HomePage() {
  redirect('/dashboard')
}