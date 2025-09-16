import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Futsal Réservation',
  description:
    'Connectez-vous à votre compte pour réserver vos matchs de futsal',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
