'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  validateEmail,
  validatePasswordStrength,
  validatePseudo,
  generateAvatarUrl,
} from '@/lib/auth/validators';

interface RegisterFormData {
  email: string;
  pseudo: string;
  password: string;
  confirmPassword: string;
  avatar: string;
}

interface RegisterFormErrors {
  email?: string;
  pseudo?: string;
  password?: string;
  confirmPassword?: string;
  avatar?: string;
  general?: string;
}

export function RegisterForm() {
  const router = useRouter();

  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    pseudo: '',
    password: '',
    confirmPassword: '',
    avatar: '',
  });

  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarLoaded, setAvatarLoaded] = useState(false);

  // Update avatar preview when pseudo or avatar URL changes
  useEffect(() => {
    if (formData.avatar.trim() && isValidUrl(formData.avatar)) {
      setAvatarPreview(formData.avatar);
    } else if (formData.pseudo.trim()) {
      setAvatarPreview(generateAvatarUrl(formData.pseudo));
    } else {
      setAvatarPreview('');
    }
    setAvatarLoaded(false);
  }, [formData.pseudo, formData.avatar]);

  const validateForm = (): boolean => {
    const newErrors: RegisterFormErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Format d'email invalide";
    }

    if (!formData.pseudo.trim()) {
      newErrors.pseudo = 'Le pseudo est requis';
    } else if (!validatePseudo(formData.pseudo)) {
      if (formData.pseudo.length < 3 || formData.pseudo.length > 20) {
        newErrors.pseudo = 'Le pseudo doit contenir entre 3 et 20 caractères';
      } else {
        newErrors.pseudo =
          'Le pseudo ne peut contenir que des lettres, chiffres, tirets et underscores';
      }
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    } else {
      const passwordValidation = validatePasswordStrength(formData.password);
      if (!passwordValidation.isValid) {
        newErrors.password = passwordValidation.errors[0];
      }
    }

    if (!formData.confirmPassword.trim()) {
      newErrors.confirmPassword = 'La confirmation est requise';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoading) return;

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const avatarUrl =
        formData.avatar.trim() || generateAvatarUrl(formData.pseudo);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          pseudo: formData.pseudo,
          password: formData.password,
          avatar: avatarUrl,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        router.replace('/dashboard');
      } else {
        setErrors({
          general: data.error || "Erreur lors de l'inscription",
        });
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({
        general: 'Erreur de connexion. Veuillez réessayer.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange =
    (field: keyof RegisterFormData) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFormData((prev) => ({
        ...prev,
        [field]: e.target.value,
      }));

      // Clear field error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({
          ...prev,
          [field]: undefined,
        }));
      }
    };

  const isValidUrl = (string: string) => {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  };

  const handleAvatarError = () => {
    if (formData.pseudo.trim()) {
      setAvatarPreview(generateAvatarUrl(formData.pseudo));
    } else {
      setAvatarPreview('');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      {/* Éléments décoratifs en arrière-plan */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-300/15 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-300/15 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-300/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="max-w-md w-full bg-white rounded-2xl shadow-2xl shadow-blue-900/10 border border-gray-100/50 p-8 animate-in fade-in-50 slide-in-from-bottom-4 duration-700 space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Inscription
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Créez votre compte Stepzy
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{errors.general}</div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className={`mt-1 relative block w-full px-3 py-2 border ${
                  errors.email ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="votre@email.com"
                value={formData.email}
                onChange={handleInputChange('email')}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="pseudo"
                className="block text-sm font-medium text-gray-700"
              >
                Pseudo
              </label>
              <input
                id="pseudo"
                name="pseudo"
                type="text"
                autoComplete="username"
                required
                className={`mt-1 relative block w-full px-3 py-2 border ${
                  errors.pseudo ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="Votre pseudo"
                value={formData.pseudo}
                onChange={handleInputChange('pseudo')}
              />
              {errors.pseudo && (
                <p className="mt-1 text-sm text-red-600">{errors.pseudo}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`relative block w-full px-3 py-2 pr-10 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Votre mot de passe"
                  value={formData.password}
                  onChange={handleInputChange('password')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Afficher le mot de passe"
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-700"
              >
                Confirmer le mot de passe
              </label>
              <div className="mt-1 relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  className={`relative block w-full px-3 py-2 pr-10 border ${
                    errors.confirmPassword
                      ? 'border-red-300'
                      : 'border-gray-300'
                  } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                  placeholder="Confirmer votre mot de passe"
                  value={formData.confirmPassword}
                  onChange={handleInputChange('confirmPassword')}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Afficher le mot de passe"
                >
                  <svg
                    className="h-5 w-5 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    {showConfirmPassword ? (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21"
                      />
                    ) : (
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    )}
                  </svg>
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="avatar"
                className="block text-sm font-medium text-gray-700"
              >
                Avatar (optionnel)
              </label>
              <input
                id="avatar"
                name="avatar"
                type="url"
                className={`mt-1 relative block w-full px-3 py-2 border ${
                  errors.avatar ? 'border-red-300' : 'border-gray-300'
                } placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm`}
                placeholder="https://example.com/votre-avatar.jpg"
                value={formData.avatar}
                onChange={handleInputChange('avatar')}
              />
              {errors.avatar && (
                <p className="mt-1 text-sm text-red-600">{errors.avatar}</p>
              )}

              {avatarPreview && (
                <div className="mt-2 flex justify-center">
                  <div className="relative w-16 h-16">
                    <Image
                      src={avatarPreview}
                      alt="Aperçu de l'avatar"
                      fill
                      className="rounded-full object-cover"
                      onLoad={() => setAvatarLoaded(true)}
                      onError={handleAvatarError}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Inscription en cours...' : "S'inscrire"}
            </button>
          </div>

          <div className="text-center">
            <Link
              href="/login"
              className="text-blue-600 hover:text-blue-500 text-sm font-medium"
            >
              Déjà un compte ? Se connecter
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
