'use client'

import Image from 'next/image'
import { SportType, getAllSports } from '@/config/sports'

interface SportSelectorProps {
  selectedSport: SportType
  onSelectSport: (sport: SportType) => void
  error?: string
}

export function SportSelector({ selectedSport, onSelectSport, error }: SportSelectorProps) {
  const sports = getAllSports()

  return (
    <div className="space-y-6">
      {/* Titre et description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quel sport voulez-vous pratiquer ?
        </h2>
        <p className="text-gray-600">
          Sélectionnez le type d'activité que vous souhaitez créer
        </p>
      </div>

      {/* Grille de sports */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mt-8">
        {sports.map((sport) => {
          const isSelected = selectedSport === sport.id

          return (
            <button
              key={sport.id}
              type="button"
              onClick={() => onSelectSport(sport.id)}
              className={`
                group relative flex flex-col items-center p-6 rounded-xl border-2 transition-all duration-200
                hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100
                ${isSelected
                  ? 'border-blue-500 bg-blue-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-gray-300'
                }
              `}
            >
              {/* Image du sport */}
              <div className="relative w-20 h-20 mb-3">
                <Image
                  src={sport.icon}
                  alt={sport.name}
                  fill
                  className="rounded-full object-cover"
                />
              </div>

              {/* Nom du sport */}
              <h3 className={`
                text-sm font-semibold text-center mb-1
                ${isSelected ? 'text-blue-700' : 'text-gray-900'}
              `}>
                {sport.name}
              </h3>

              {/* Nombre de joueurs recommandé */}
              <p className="text-xs text-gray-500 text-center">
                {sport.minPlayers} - {sport.maxPlayers} joueurs
              </p>

              {/* Icône de sélection */}
              {isSelected && (
                <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}

              {/* Badge de couleur du sport */}
              <div className={`absolute bottom-2 left-2 w-3 h-3 rounded-full ${sport.color}`} />
            </button>
          )
        })}
      </div>

      {/* Message d'erreur */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Description du sport sélectionné */}
      {selectedSport && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex items-start gap-3">
            <div className={`w-2 h-2 rounded-full ${sports.find(s => s.id === selectedSport)?.color} mt-1.5`} />
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-1">
                {sports.find(s => s.id === selectedSport)?.name}
              </h4>
              <p className="text-sm text-gray-600">
                {sports.find(s => s.id === selectedSport)?.description}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
