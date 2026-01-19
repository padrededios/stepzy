'use client'

interface WizardProgressBarProps {
  currentStep: number
  totalSteps: number
  labels: string[]
}

export function WizardProgressBar({ currentStep, totalSteps, labels }: WizardProgressBarProps) {
  return (
    <div className="w-full py-4">
      <div className="flex items-center justify-center">
        <div className="flex items-center justify-between w-full max-w-2xl px-4">
        {Array.from({ length: totalSteps }, (_, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === currentStep
          const isCompleted = stepNumber < currentStep
          const isUpcoming = stepNumber > currentStep

          return (
            <div key={stepNumber} className="flex items-center flex-1">
              {/* Cercle de l'étape */}
              <div className="flex flex-col items-center relative">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm transition-all duration-300
                    ${isCompleted ? 'bg-blue-600 text-white' : ''}
                    ${isActive ? 'bg-blue-600 text-white ring-4 ring-blue-100 scale-110' : ''}
                    ${isUpcoming ? 'bg-gray-200 text-gray-500' : ''}
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{stepNumber}</span>
                  )}
                </div>

                {/* Label de l'étape (masqué sur mobile) */}
                <span
                  className={`
                    absolute top-14 text-sm font-medium whitespace-nowrap hidden md:block
                    ${isActive ? 'text-blue-600 font-semibold' : 'text-gray-500'}
                  `}
                >
                  {labels[index]}
                </span>
              </div>

              {/* Ligne de connexion (sauf pour la dernière étape) */}
              {stepNumber < totalSteps && (
                <div className="flex-1 h-1 mx-2">
                  <div
                    className={`
                      h-full transition-all duration-300
                      ${stepNumber < currentStep ? 'bg-blue-600' : 'bg-gray-200'}
                    `}
                  />
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* Label de l'étape active (visible sur mobile uniquement) */}
      <div className="mt-6 text-center md:hidden">
        <span className="text-sm font-semibold text-blue-600">
          {labels[currentStep - 1]}
        </span>
      </div>
    </div>
  )
}
