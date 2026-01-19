'use client'

import { DayOfWeek, RecurringType, DAY_LABELS, RECURRING_TYPE_LABELS } from '@/types/activity'

interface ScheduleStepProps {
  startTime: string
  endTime: string
  recurringDays: DayOfWeek[]
  recurringType: RecurringType
  onStartTimeChange: (value: string) => void
  onEndTimeChange: (value: string) => void
  onDaysChange: (days: DayOfWeek[]) => void
  onRecurringTypeChange: (type: RecurringType) => void
  errors?: {
    startTime?: string
    endTime?: string
    recurringDays?: string
    recurringType?: string
  }
}

// Générer les créneaux horaires par tranche de 15 minutes
const generateTimeSlots = (): string[] => {
  const slots: string[] = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = minute.toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots
}

const AVAILABLE_DAYS: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']

export function ScheduleStep({
  startTime,
  endTime,
  recurringDays,
  recurringType,
  onStartTimeChange,
  onEndTimeChange,
  onDaysChange,
  onRecurringTypeChange,
  errors = {}
}: ScheduleStepProps) {
  const timeSlots = generateTimeSlots()

  const handleDayToggle = (day: DayOfWeek) => {
    const newDays = recurringDays.includes(day)
      ? recurringDays.filter(d => d !== day)
      : [...recurringDays, day]
    onDaysChange(newDays)
  }

  // Calculer la durée
  const calculateDuration = (): string => {
    if (!startTime || !endTime) return ''

    const [startH, startM] = startTime.split(':').map(Number)
    const [endH, endM] = endTime.split(':').map(Number)

    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    const diff = endMinutes - startMinutes
    if (diff <= 0) return ''

    const hours = Math.floor(diff / 60)
    const minutes = diff % 60

    if (hours === 0) return `${minutes} min`
    if (minutes === 0) return `${hours}h`
    return `${hours}h${minutes.toString().padStart(2, '0')}`
  }

  const duration = calculateDuration()

  return (
    <div className="space-y-8">
      {/* Titre et description */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Quand se déroule l'activité ?
        </h2>
        <p className="text-gray-600">
          Configurez les horaires et les jours de récurrence
        </p>
      </div>

      {/* Type de récurrence */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Fréquence <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(Object.entries(RECURRING_TYPE_LABELS) as [RecurringType, string][]).map(([type, label]) => (
            <button
              key={type}
              type="button"
              onClick={() => onRecurringTypeChange(type)}
              className={`
                relative flex items-center justify-center py-3 px-4 border-2 rounded-lg transition-all
                focus:outline-none focus:ring-4 focus:ring-blue-100
                ${recurringType === type
                  ? 'border-blue-500 bg-blue-50 text-blue-700 font-medium'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }
              `}
            >
              {recurringType === type && (
                <svg
                  className="w-5 h-5 absolute left-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              )}
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Horaires */}
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Horaires <span className="text-red-500">*</span>
        </label>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Heure de début */}
          <div className="space-y-2">
            <label htmlFor="start-time" className="block text-xs font-medium text-gray-600">
              Début
            </label>
            <select
              id="start-time"
              value={startTime}
              onChange={(e) => onStartTimeChange(e.target.value)}
              className={`
                w-full px-4 py-3 border-2 rounded-lg text-lg font-medium transition-all
                focus:outline-none focus:ring-4 focus:ring-blue-100
                ${errors.startTime
                  ? 'border-red-300 bg-red-50 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-500'
                }
              `}
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          {/* Heure de fin */}
          <div className="space-y-2">
            <label htmlFor="end-time" className="block text-xs font-medium text-gray-600">
              Fin
            </label>
            <select
              id="end-time"
              value={endTime}
              onChange={(e) => onEndTimeChange(e.target.value)}
              className={`
                w-full px-4 py-3 border-2 rounded-lg text-lg font-medium transition-all
                focus:outline-none focus:ring-4 focus:ring-blue-100
                ${errors.endTime
                  ? 'border-red-300 bg-red-50 focus:border-red-500'
                  : 'border-gray-200 focus:border-blue-500'
                }
              `}
            >
              {timeSlots.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Durée calculée */}
        {duration && !errors.endTime && (
          <div className="flex items-center justify-center gap-2 text-sm text-green-600 bg-green-50 py-2 rounded-lg">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span>Durée : {duration}</span>
          </div>
        )}

        {errors.startTime && (
          <p className="text-sm text-red-600 text-center">{errors.startTime}</p>
        )}
        {errors.endTime && (
          <p className="text-sm text-red-600 text-center">{errors.endTime}</p>
        )}
      </div>

      {/* Jours de la semaine */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">
          Jours de récurrence <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500">
          Sélectionnez les jours où l'activité aura lieu
        </p>

        <div className="grid grid-cols-2 md:grid-cols-7 gap-2">
          {AVAILABLE_DAYS.map((day) => {
            const isSelected = recurringDays.includes(day)

            return (
              <button
                key={day}
                type="button"
                onClick={() => handleDayToggle(day)}
                className={`
                  relative py-4 px-2 rounded-lg border-2 font-medium text-sm transition-all
                  focus:outline-none focus:ring-4 focus:ring-blue-100
                  ${isSelected
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                {DAY_LABELS[day]}

                {isSelected && (
                  <div className="absolute top-1 right-1 w-4 h-4 bg-white rounded-full flex items-center justify-center">
                    <svg className="w-3 h-3 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </button>
            )
          })}
        </div>

        {errors.recurringDays && (
          <p className="text-sm text-red-600 text-center">{errors.recurringDays}</p>
        )}
      </div>

      {/* Prévisualisation */}
      {recurringDays.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <svg
              className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div>
              <h4 className="text-sm font-medium text-blue-900 mb-1">Aperçu du planning</h4>
              <p className="text-sm text-blue-700">
                Cette activité aura lieu <strong>{RECURRING_TYPE_LABELS[recurringType]}</strong> les{' '}
                <strong>{recurringDays.map(day => DAY_LABELS[day]).join(', ')}</strong>
                {' '}de <strong>{startTime}</strong> à <strong>{endTime}</strong>
                {duration && <span> ({duration})</span>}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
