import { Suspense } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Connexion - Stepzy',
  description:
    'Connectez-vous à votre compte pour réserver vos activités sportives',
};

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <LoginForm />
    </Suspense>
  );
}
