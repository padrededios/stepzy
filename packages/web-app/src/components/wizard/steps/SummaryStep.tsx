'use client'

import Image from 'next/image'
import { CreateActivityData, DAY_LABELS, RECURRING_TYPE_LABELS } from '@/types/activity'
import { getSportConfig } from '@/config/sports'

interface SummaryStepProps {
  formData: CreateActivityData
  onEdit: (step: number) => void
}

export function SummaryStep({ formData, onEdit }: SummaryStepProps) {
  const sportConfig = getSportConfig(formData.sport)

  // Calculer la durée
  const calculateDuration = (): string => {
    const [startH, startM] = formData.startTime.split(':').map(Number)
    const [endH, endM] = formData.endTime.split(':').map(Number)

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM
    const diff = endMinutes - startMinutes

    const hours = Math.floor(diff / 60)
    const minutes = diff % 60

    if (hours === 0) return `${minutes} min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h${minutes.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Titre */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Récapitulatif de votre activité
        </h2>
        <p className="text-gray-600">
          Vérifiez les informations avant de créer l'activité
        </p>
      </div>

      {/* Carte principale */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
        <div className="flex items-start gap-4">
          {/* Icône du sport */}
          <div className="relative w-16 h-16 flex-shrink-0">
            <Image
              src={sportConfig.icon}
              alt={sportConfig.name}
              fill
              className="rounded-full object-cover"
            />
            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full ${sportConfig.color}`} />
          </div>

          {/* Nom et description */}
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {formData.name}
            </h3>
            {formData.description && (
              <p className="text-gray-700 text-sm">
                {formData.description}
              </p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${sportConfig.color} text-white`}>
                {sportConfig.name}
              </span>
            </div>
          </div>

          {/* Bouton modifier */}
          <button
            type="button"
            onClick={() => onEdit(2)}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            <svg className="w-4 h-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Modifier
          </button>
        </div>
      </div>

      {/* Grille d'informations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Joueurs */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-900">Participants</h4>
            </div>
            <button
              type="button"
              onClick={() => onEdit(3)}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              Modifier
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Minimum</span>
              <span className="font-semibold text-gray-900">{formData.minPlayers} joueurs</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Maximum</span>
              <span className="font-semibold text-gray-900">{formData.maxPlayers} joueurs</span>
            </div>
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
              <span>Recommandé</span>
              <span>{sportConfig.minPlayers} - {sportConfig.maxPlayers}</span>
            </div>
          </div>
        </div>

        {/* Planning */}
        <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h4 className="text-sm font-semibold text-gray-900">Planning</h4>
            </div>
            <button
              type="button"
              onClick={() => onEdit(4)}
              className="text-blue-600 hover:text-blue-700 text-xs font-medium"
            >
              Modifier
            </button>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Fréquence</span>
              <span className="font-semibold text-gray-900">
                {RECURRING_TYPE_LABELS[formData.recurringType]}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Horaires</span>
              <span className="font-semibold text-gray-900">
                {formData.startTime} - {formData.endTime}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Durée</span>
              <span className="font-semibold text-gray-900">{calculateDuration()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Jours sélectionnés */}
      <div className="bg-white border-2 border-gray-200 rounded-lg p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h4 className="text-sm font-semibold text-gray-900">
              Jours de récurrence ({formData.recurringDays.length} jour{formData.recurringDays.length > 1 ? 's' : ''})
            </h4>
          </div>
          <button
            type="button"
            onClick={() => onEdit(4)}
            className="text-blue-600 hover:text-blue-700 text-xs font-medium"
          >
            Modifier
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {formData.recurringDays.map(day => (
            <span
              key={day}
              className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium bg-blue-100 text-blue-700"
            >
              {DAY_LABELS[day]}
            </span>
          ))}
        </div>
      </div>

      {/* Note importante */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-900 mb-1">À savoir</h4>
            <p className="text-sm text-amber-700">
              Les sessions seront générées automatiquement et visibles 2 semaines à l'avance.
              Les participants pourront s'inscrire dès maintenant.
            </p>
          </div>
        </div>
      </div>

      {/* Bouton de validation */}
      <div className="text-center pt-4">
        <p className="text-sm text-gray-500">
          En cliquant sur "Créer l'activité", vous confirmez que toutes les informations sont correctes.
        </p>
      </div>
    </div>
  )
}
