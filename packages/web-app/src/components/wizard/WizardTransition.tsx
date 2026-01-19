'use client'

import { ReactNode, useEffect, useState } from 'react'

interface WizardTransitionProps {
  children: ReactNode
  currentStep: number
  direction: 'next' | 'prev'
}

export function WizardTransition({ children, currentStep, direction }: WizardTransitionProps) {
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayStep, setDisplayStep] = useState(currentStep)

  useEffect(() => {
    if (displayStep !== currentStep) {
      setIsTransitioning(true)

      // Petite pause avant de changer le contenu
      const timeout = setTimeout(() => {
        setDisplayStep(currentStep)
        setIsTransitioning(false)
      }, 300)

      return () => clearTimeout(timeout)
    }
  }, [currentStep, displayStep])

  const slideDirection = direction === 'next' ? 'translate-x-full' : '-translate-x-full'
  const slideFrom = direction === 'next' ? '-translate-x-full' : 'translate-x-full'

  return (
    <div className="relative">
      <div
        className={`
          transition-all duration-300 ease-in-out
          ${isTransitioning
            ? `opacity-0 ${slideDirection}`
            : 'opacity-100 translate-x-0'
          }
        `}
      >
        {children}
      </div>
    </div>
  )
}
