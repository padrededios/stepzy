'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useWizardForm } from '@/hooks/useWizardForm'
import { WizardContainer } from '@/components/wizard/WizardContainer'
import { WizardTransition } from '@/components/wizard/WizardTransition'
import { SportSelector } from '@/components/wizard/steps/SportSelector'
import { ActivityInfoStep } from '@/components/wizard/steps/ActivityInfoStep'
import { PlayerCountStep } from '@/components/wizard/steps/PlayerCountStep'
import { ScheduleStep } from '@/components/wizard/steps/ScheduleStep'
import { SummaryStep } from '@/components/wizard/steps/SummaryStep'
import { Toast } from '@/components/ui/Toast'
import { activitiesApi } from '@/lib/api'
import { useChatContext } from '@/contexts/ChatContext'
import { DayOfWeek, RecurringType } from '@/types/activity'
import { SportType } from '@/config/sports'

const STEP_LABELS = ['Sport', 'Informations', 'Participants', 'Planning', 'Récapitulatif']

export default function CreateActivityPage() {
  const router = useRouter()
  const { refreshRooms } = useChatContext()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const {
    currentStep,
    formData,
    errors,
    direction,
    totalSteps,
    isFirstStep,
    isLastStep,
    nextStep,
    prevStep,
    goToStep,
    updateFormData,
    validateCurrentStep,
    resetForm
  } = useWizardForm()

  const handleNext = () => {
    nextStep()
  }

  const handleBack = () => {
    prevStep()
  }

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return

    setIsSubmitting(true)
    setMessage(null)

    try {
      const result = await activitiesApi.create(formData)

      if (result.success) {
        setMessage({ type: 'success', text: 'Activité créée avec succès' })

        // Nettoyer les données sauvegardées
        localStorage.removeItem('wizard-create-activity')

        // Rafraîchir les salons de chat pour inclure le nouveau salon
        await refreshRooms()

        // Rediriger vers la page s'inscrire après 2 secondes
        setTimeout(() => {
          router.push('/mes-activites')
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || 'Erreur lors de la création de l\'activité' })
        setIsSubmitting(false)
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur de connexion. Veuillez réessayer.' })
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <SportSelector
            selectedSport={formData.sport}
            onSelectSport={(sport: SportType) => updateFormData({ sport })}
            error={errors.sport}
          />
        )

      case 2:
        return (
          <ActivityInfoStep
            name={formData.name}
            description={formData.description || ''}
            onNameChange={(value) => updateFormData({ name: value })}
            onDescriptionChange={(value) => updateFormData({ description: value })}
            errors={errors}
          />
        )

      case 3:
        return (
          <PlayerCountStep
            sport={formData.sport}
            minPlayers={formData.minPlayers}
            maxPlayers={formData.maxPlayers}
            onMinChange={(value) => updateFormData({ minPlayers: value })}
            onMaxChange={(value) => updateFormData({ maxPlayers: value })}
            errors={errors}
          />
        )

      case 4:
        return (
          <ScheduleStep
            startTime={formData.startTime}
            endTime={formData.endTime}
            recurringDays={formData.recurringDays}
            recurringType={formData.recurringType}
            onStartTimeChange={(value) => updateFormData({ startTime: value })}
            onEndTimeChange={(value) => updateFormData({ endTime: value })}
            onDaysChange={(days: DayOfWeek[]) => updateFormData({ recurringDays: days })}
            onRecurringTypeChange={(type: RecurringType) => updateFormData({ recurringType: type })}
            errors={errors}
          />
        )

      case 5:
        return (
          <SummaryStep
            formData={formData}
            onEdit={goToStep}
          />
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4 pb-20">
      {/* Toast Notification */}
      {message && (
        <Toast
          message={message.text}
          type={message.type}
          onClose={() => setMessage(null)}
        />
      )}

      {/* Header */}
      <div className="max-w-4xl mx-auto mb-12 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
          Créer une nouvelle activité
        </h1>
        <p className="text-gray-600 text-lg">
          Créez une activité récurrente que les autres utilisateurs pourront rejoindre
        </p>
      </div>

      {/* Wizard */}
      <WizardContainer
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={STEP_LABELS}
        onNext={handleNext}
        onBack={handleBack}
        onSubmit={handleSubmit}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        isSubmitting={isSubmitting}
        nextDisabled={false}
      >
        <WizardTransition currentStep={currentStep} direction={direction}>
          {renderStep()}
        </WizardTransition>
      </WizardContainer>
    </div>
  )
}
