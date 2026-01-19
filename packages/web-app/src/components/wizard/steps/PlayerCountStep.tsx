'use client'

import { SportType, getSportConfig } from '@/config/sports'

interface PlayerCountStepProps {
  sport: SportType
  minPlayers: number
  maxPlayers: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  errors?: {
    minPlayers?: string
    maxPlayers?: string
  }
}

export function PlayerCountStep({
  sport,
  minPlayers,
  maxPlayers,
  onMinChange,
  onMaxChange,
  errors = {}
}: PlayerCountStepProps) {
  const sportConfig = getSportConfig(sport)
  const recommendedMin = sportConfig.minPlayers
  const recommendedMax = sportConfig.maxPlayers

  const isMinRecommended = minPlayers >= recommendedMin && minPlayers <= recommendedMax
  const isMaxRecommended = maxPlayers >= recommendedMin && maxPlayers <= recommendedMax

  const handleIncrement = (type: 'min' | 'max') => {
    if (type === 'min') {
      if (minPlayers < 100) onMinChange(minPlayers + 1)
    } else {
      if (maxPlayers < 100) onMaxChange(maxPlayers + 1)
    }
  }

  const handleDecrement = (type: 'min' | 'max') => {
    if (type === 'min') {
      if (minPlayers > 2) onMinChange(minPlayers - 1)
    } else {
      if (maxPlayers > 2) onMaxChange(maxPlayers - 1)
    }
  }

  return (
    <div className="space-y-8">
      {/* Titre et description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Combien de joueurs ?
        </h2>
        <p className="text-gray-600">
          Définissez le nombre minimum et maximum de participants pour votre activité
        </p>
      </div>

      {/* Recommandations pour le sport */}
      <div className={`p-4 rounded-lg border-2 ${sportConfig.color} bg-opacity-10`}>
        <div className="flex items-center gap-3">
          <div className={`w-3 h-3 rounded-full ${sportConfig.color}`} />
          <div>
            <p className="text-sm font-medium text-gray-900">
              Recommandation pour {sportConfig.name}
            </p>
            <p className="text-sm text-gray-600">
              {recommendedMin} à {recommendedMax} joueurs
            </p>
          </div>
        </div>
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Compteur minimum */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Nombre minimum de joueurs <span className="text-red-500">*</span>
          </label>

          <div className="flex items-center justify-center gap-4">
            {/* Bouton - */}
            <button
              type="button"
              onClick={() => handleDecrement('min')}
              disabled={minPlayers <= 2}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all
                ${minPlayers <= 2
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                }
              `}
            >
              -
            </button>

            {/* Affichage du nombre */}
            <div className="flex flex-col items-center">
              <div className={`
                text-5xl font-bold w-24 text-center
                ${errors.minPlayers ? 'text-red-600' : 'text-gray-900'}
              `}>
                {minPlayers}
              </div>
              {isMinRecommended && (
                <span className="text-xs text-green-600 font-medium mt-1">
                  ✓ Recommandé
                </span>
              )}
            </div>

            {/* Bouton + */}
            <button
              type="button"
              onClick={() => handleIncrement('min')}
              disabled={minPlayers >= 100}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all
                ${minPlayers >= 100
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                }
              `}
            >
              +
            </button>
          </div>

          {errors.minPlayers && (
            <p className="text-sm text-red-600 text-center">{errors.minPlayers}</p>
          )}
        </div>

        {/* Compteur maximum */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Nombre maximum de joueurs <span className="text-red-500">*</span>
          </label>

          <div className="flex items-center justify-center gap-4">
            {/* Bouton - */}
            <button
              type="button"
              onClick={() => handleDecrement('max')}
              disabled={maxPlayers <= 2}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all
                ${maxPlayers <= 2
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                }
              `}
            >
              -
            </button>

            {/* Affichage du nombre */}
            <div className="flex flex-col items-center">
              <div className={`
                text-5xl font-bold w-24 text-center
                ${errors.maxPlayers ? 'text-red-600' : 'text-gray-900'}
              `}>
                {maxPlayers}
              </div>
              {isMaxRecommended && (
                <span className="text-xs text-green-600 font-medium mt-1">
                  ✓ Recommandé
                </span>
              )}
            </div>

            {/* Bouton + */}
            <button
              type="button"
              onClick={() => handleIncrement('max')}
              disabled={maxPlayers >= 100}
              className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold transition-all
                ${maxPlayers >= 100
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-blue-100 text-blue-600 hover:bg-blue-200 active:scale-95'
                }
              `}
            >
              +
            </button>
          </div>

          {errors.maxPlayers && (
            <p className="text-sm text-red-600 text-center">{errors.maxPlayers}</p>
          )}
        </div>
      </div>

      {/* Contraintes */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Contraintes</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li className="flex items-center gap-2">
            <span className={minPlayers >= 2 ? 'text-green-600' : 'text-gray-400'}>
              {minPlayers >= 2 ? '✓' : '○'}
            </span>
            Minimum : 2 joueurs
          </li>
          <li className="flex items-center gap-2">
            <span className={maxPlayers <= 100 ? 'text-green-600' : 'text-gray-400'}>
              {maxPlayers <= 100 ? '✓' : '○'}
            </span>
            Maximum : 100 joueurs
          </li>
          <li className="flex items-center gap-2">
            <span className={minPlayers <= maxPlayers ? 'text-green-600' : 'text-red-600'}>
              {minPlayers <= maxPlayers ? '✓' : '✗'}
            </span>
            Le minimum doit être inférieur ou égal au maximum
          </li>
        </ul>
      </div>
    </div>
  )
}
