'use client'

import { ChangeEvent } from 'react'

interface ActivityInfoStepProps {
  name: string
  description: string
  onNameChange: (value: string) => void
  onDescriptionChange: (value: string) => void
  errors?: {
    name?: string
    description?: string
  }
}

export function ActivityInfoStep({
  name,
  description,
  onNameChange,
  onDescriptionChange,
  errors = {}
}: ActivityInfoStepProps) {
  const nameLength = name.length
  const maxNameLength = 100

  const examplePlaceholders = [
    'Foot entre collègues',
    'Badminton du mardi',
    'Volley du dimanche',
    'Tournoi de ping-pong',
    'Rugby après le travail'
  ]

  const descriptionPlaceholder = 'Ajouter plus de détails : niveau requis, équipements fournis, point de rendez-vous...'

  return (
    <div className="space-y-8">
      {/* Titre et description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Donnez un nom à votre activité
        </h2>
        <p className="text-gray-600">
          Choisissez un nom accrocheur qui donne envie de participer
        </p>
      </div>

      {/* Champ nom */}
      <div className="space-y-2">
        <label htmlFor="activity-name" className="block text-sm font-medium text-gray-700">
          Nom de l'activité <span className="text-red-500">*</span>
        </label>
        <input
          id="activity-name"
          type="text"
          value={name}
          onChange={(e: ChangeEvent<HTMLInputElement>) => onNameChange(e.target.value)}
          placeholder={examplePlaceholders[Math.floor(Math.random() * examplePlaceholders.length)]}
          maxLength={maxNameLength}
          className={`
            w-full px-4 py-3 text-lg border-2 rounded-lg transition-all
            focus:outline-none focus:ring-4 focus:ring-blue-100
            ${errors.name
              ? 'border-red-300 bg-red-50 focus:border-red-500'
              : 'border-gray-200 focus:border-blue-500'
            }
          `}
        />

        {/* Compteur de caractères */}
        <div className="flex items-center justify-between text-xs">
          <div>
            {errors.name ? (
              <p className="text-red-600 font-medium">{errors.name}</p>
            ) : (
              <p className="text-gray-500">
                {nameLength >= 3 ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Nom valide
                  </span>
                ) : (
                  <span>Minimum 3 caractères</span>
                )}
              </p>
            )}
          </div>
          <p className={`
            ${nameLength > maxNameLength * 0.9 ? 'text-orange-600' : 'text-gray-400'}
          `}>
            {nameLength} / {maxNameLength}
          </p>
        </div>
      </div>

      {/* Champ description */}
      <div className="space-y-2">
        <label htmlFor="activity-description" className="block text-sm font-medium text-gray-700">
          Description <span className="text-gray-400 text-xs">(optionnel)</span>
        </label>
        <textarea
          id="activity-description"
          value={description}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onDescriptionChange(e.target.value)}
          placeholder={descriptionPlaceholder}
          rows={4}
          maxLength={500}
          className={`
            w-full px-4 py-3 border-2 rounded-lg transition-all resize-none
            focus:outline-none focus:ring-4 focus:ring-blue-100
            ${errors.description
              ? 'border-red-300 bg-red-50 focus:border-red-500'
              : 'border-gray-200 focus:border-blue-500'
            }
          `}
        />

        {/* Compteur pour la description */}
        <div className="flex justify-end text-xs text-gray-400">
          <p>{description.length} / 500</p>
        </div>
      </div>

      {/* Conseils */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Conseils</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Soyez concis et explicite</li>
              <li>• Mentionnez le niveau requis si nécessaire</li>
              <li>• Indiquez si le matériel est fourni</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
