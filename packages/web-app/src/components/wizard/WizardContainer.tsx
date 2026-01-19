'use client'

import { ReactNode } from 'react'
import { WizardProgressBar } from './WizardProgressBar'

interface WizardContainerProps {
  children: ReactNode
  currentStep: number
  totalSteps: number
  stepLabels: string[]
  onNext?: () => void
  onBack?: () => void
  onSubmit?: () => void
  isFirstStep: boolean
  isLastStep: boolean
  isSubmitting?: boolean
  nextDisabled?: boolean
}

export function WizardContainer({
  children,
  currentStep,
  totalSteps,
  stepLabels,
  onNext,
  onBack,
  onSubmit,
  isFirstStep,
  isLastStep,
  isSubmitting = false,
  nextDisabled = false
}: WizardContainerProps) {
  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Barre de progression */}
      <div className="mb-12">
        <WizardProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          labels={stepLabels}
        />
      </div>

      {/* Contenu de l'étape */}
      <div className="bg-white/50 backdrop-blur-sm rounded-3xl p-8 md:p-12">
        <div className="mb-10">
          {children}
        </div>

        {/* Boutons de navigation */}
        <div className="flex items-center justify-between pt-8">
          {/* Bouton Précédent */}
          <button
            type="button"
            onClick={onBack}
            disabled={isFirstStep || isSubmitting}
            className={`
              px-6 py-2.5 rounded-lg font-medium text-sm transition-all
              ${isFirstStep || isSubmitting
                ? 'invisible'
                : 'text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300'
              }
            `}
          >
            Précédent
          </button>

          {/* Indicateur d'étape sur mobile */}
          <div className="md:hidden text-sm text-gray-500 font-medium">
            Étape {currentStep} / {totalSteps}
          </div>

          {/* Bouton Suivant / Créer */}
          {isLastStep ? (
            <button
              type="button"
              onClick={onSubmit}
              disabled={isSubmitting}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all
                flex items-center gap-2
                ${isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                }
                text-white
              `}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Création...
                </>
              ) : (
                <>
                  Créer l'activité
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onNext}
              disabled={nextDisabled || isSubmitting}
              className={`
                px-6 py-2.5 rounded-lg font-medium text-sm transition-all
                flex items-center gap-2
                ${nextDisabled || isSubmitting
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500'
                }
              `}
            >
              Suivant
              <svg
                className="w-4 h-4"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Aide contextuelle */}
      <div className="mt-6 text-center text-sm text-gray-500">
        <p>Vous pouvez revenir en arrière à tout moment sans perdre vos données</p>
      </div>
    </div>
  )
}
