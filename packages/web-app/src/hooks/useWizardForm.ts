'use client'

import { useState, useCallback, useEffect } from 'react'
import { CreateActivityData } from '@/types/activity'

const TOTAL_STEPS = 5
const STORAGE_KEY = 'wizard-create-activity'

interface WizardFormState {
  currentStep: number
  formData: CreateActivityData
  errors: Record<string, string>
  direction: 'next' | 'prev'
}

interface UseWizardFormReturn {
  // État
  currentStep: number
  formData: CreateActivityData
  errors: Record<string, string>
  direction: 'next' | 'prev'
  totalSteps: number
  isFirstStep: boolean
  isLastStep: boolean

  // Actions
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  updateFormData: (partial: Partial<CreateActivityData>) => void
  setError: (field: string, message: string) => void
  clearError: (field: string) => void
  clearAllErrors: () => void
  validateCurrentStep: () => boolean
  resetForm: () => void

  // Données sauvegardées
  hasSavedData: boolean
  restoreSavedData: () => void
  clearSavedData: () => void
}

const getInitialFormData = (): CreateActivityData => ({
  name: '',
  description: '',
  sport: 'football',
  minPlayers: 2,
  maxPlayers: 12,
  recurringDays: [],
  recurringType: 'weekly',
  startTime: '12:00',
  endTime: '13:00'
})

export function useWizardForm(): UseWizardFormReturn {
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<CreateActivityData>(getInitialFormData())
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [hasSavedData, setHasSavedData] = useState(false)

  // Vérifier si des données sont sauvegardées au montage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      setHasSavedData(true)
    }
  }, [])

  // Sauvegarder les données à chaque changement
  useEffect(() => {
    if (formData.name || formData.description || formData.recurringDays.length > 0) {
      const state: WizardFormState = {
        currentStep,
        formData,
        errors,
        direction
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    }
  }, [currentStep, formData, errors, direction])

  // Restaurer les données sauvegardées
  const restoreSavedData = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const state: WizardFormState = JSON.parse(saved)
        setCurrentStep(state.currentStep)
        setFormData(state.formData)
        setErrors(state.errors)
        setDirection(state.direction)
        setHasSavedData(false)
      } catch (error) {
        console.error('Erreur lors de la restauration des données:', error)
      }
    }
  }, [])

  // Effacer les données sauvegardées
  const clearSavedData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setHasSavedData(false)
  }, [])

  // Valider l'étape courante
  const validateCurrentStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    switch (currentStep) {
      case 1: // Sport
        if (!formData.sport) {
          newErrors.sport = 'Veuillez sélectionner un sport'
        }
        break

      case 2: // Nom et description
        if (!formData.name.trim()) {
          newErrors.name = 'Le nom de l\'activité est obligatoire'
        } else if (formData.name.length < 3) {
          newErrors.name = 'Le nom doit faire au moins 3 caractères'
        }
        break

      case 3: // Nombre de joueurs
        if (formData.minPlayers < 2) {
          newErrors.minPlayers = 'Le nombre minimum de joueurs doit être au moins 2'
        }
        if (formData.maxPlayers > 100) {
          newErrors.maxPlayers = 'Le nombre maximum de joueurs ne peut pas dépasser 100'
        }
        if (formData.minPlayers > formData.maxPlayers) {
          newErrors.maxPlayers = 'Le nombre minimum ne peut pas être supérieur au nombre maximum'
        }
        break

      case 4: // Planning
        if (formData.recurringDays.length === 0) {
          newErrors.recurringDays = 'Vous devez sélectionner au moins un jour de la semaine'
        }
        if (!formData.startTime) {
          newErrors.startTime = 'L\'heure de début est obligatoire'
        }
        if (!formData.endTime) {
          newErrors.endTime = 'L\'heure de fin est obligatoire'
        }
        if (formData.startTime && formData.endTime && formData.startTime >= formData.endTime) {
          newErrors.endTime = 'L\'heure de fin doit être après l\'heure de début'
        }
        break

      case 5: // Récapitulatif (pas de validation supplémentaire)
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [currentStep, formData])

  // Passer à l'étape suivante
  const nextStep = useCallback(() => {
    if (currentStep >= TOTAL_STEPS) return

    if (validateCurrentStep()) {
      setDirection('next')
      setCurrentStep(prev => prev + 1)
      setErrors({})
    }
  }, [currentStep, validateCurrentStep])

  // Revenir à l'étape précédente
  const prevStep = useCallback(() => {
    if (currentStep <= 1) return

    setDirection('prev')
    setCurrentStep(prev => prev - 1)
    setErrors({})
  }, [currentStep])

  // Aller à une étape spécifique
  const goToStep = useCallback((step: number) => {
    if (step < 1 || step > TOTAL_STEPS) return

    setDirection(step > currentStep ? 'next' : 'prev')
    setCurrentStep(step)
    setErrors({})
  }, [currentStep])

  // Mettre à jour les données du formulaire
  const updateFormData = useCallback((partial: Partial<CreateActivityData>) => {
    setFormData(prev => ({ ...prev, ...partial }))

    // Effacer les erreurs des champs modifiés
    const updatedFields = Object.keys(partial)
    setErrors(prev => {
      const newErrors = { ...prev }
      updatedFields.forEach(field => {
        delete newErrors[field]
      })
      return newErrors
    })
  }, [])

  // Définir une erreur
  const setError = useCallback((field: string, message: string) => {
    setErrors(prev => ({ ...prev, [field]: message }))
  }, [])

  // Effacer une erreur
  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  // Effacer toutes les erreurs
  const clearAllErrors = useCallback(() => {
    setErrors({})
  }, [])

  // Réinitialiser le formulaire
  const resetForm = useCallback(() => {
    setCurrentStep(1)
    setFormData(getInitialFormData())
    setErrors({})
    setDirection('next')
    clearSavedData()
  }, [clearSavedData])

  return {
    // État
    currentStep,
    formData,
    errors,
    direction,
    totalSteps: TOTAL_STEPS,
    isFirstStep: currentStep === 1,
    isLastStep: currentStep === TOTAL_STEPS,

    // Actions
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    setError,
    clearError,
    clearAllErrors,
    validateCurrentStep,
    resetForm,

    // Données sauvegardées
    hasSavedData,
    restoreSavedData,
    clearSavedData
  }
}
