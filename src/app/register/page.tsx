import { RegisterForm } from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - Futsal Réservation',
  description: 'Créez votre compte pour réserver vos matchs de futsal',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
