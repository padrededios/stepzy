import { RegisterForm } from '@/components/auth/RegisterForm';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inscription - Stepzy',
  description: 'Créez votre compte pour réserver vos activités sportives',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
