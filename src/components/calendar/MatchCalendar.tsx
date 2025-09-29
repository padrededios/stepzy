'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Match, User } from '@/types'

interface MatchCalendarProps {
  matches?: Match[]
  onMatchClick?: (match: Match) => void
  onDateClick?: (date: Date) => void
  currentUser?: User
}

const MatchCalendar: React.FC<MatchCalendarProps> = ({ 
  matches = [], 
  onMatchClick, 
  onDateClick,
  currentUser 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)

  // Get current month's calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    // First day of the month
    const firstDay = new Date(year, month, 1)
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0)
    // First day of calendar (might be from previous month)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    // Last day of calendar (might be from next month)
    const endDate = new Date(startDate)
    endDate.setDate(endDate.getDate() + 41) // 6 weeks * 7 days

    const days = []
    const currentDay = new Date(startDate)

    while (currentDay <= endDate) {
      days.push({
        date: new Date(currentDay),
        isCurrentMonth: currentDay.getMonth() === month,
        isToday: currentDay.toDateString() === new Date().toDateString(),
        isWeekend: currentDay.getDay() === 0 || currentDay.getDay() === 6,
        matches: matches.filter(match => 
          match.date.toDateString() === currentDay.toDateString()
        )
      })
      currentDay.setDate(currentDay.getDate() + 1)
    }

    return days
  }, [currentDate, matches])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const handleDateClick = (date: Date) => {
    setSelectedDate(date)
    onDateClick?.(date)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-green-500'
      case 'full': return 'bg-yellow-500'
      case 'completed': return 'bg-blue-500'
      case 'cancelled': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const monthNames = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const dayNames = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        
        <div className="flex space-x-2">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Mois précédent"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <button
            onClick={() => setCurrentDate(new Date())}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
          >
            Aujourd'hui
          </button>
          
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-md"
            aria-label="Mois suivant"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Days of week header */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {dayNames.map(day => (
          <div key={day} className="bg-gray-50 p-2 text-center">
            <span className="text-xs font-medium text-gray-700">{day}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200">
        {calendarData.map((day, index) => (
          <div
            key={index}
            className={`bg-white min-h-[120px] p-2 ${
              !day.isCurrentMonth ? 'bg-gray-50' : ''
            } ${
              day.isWeekend && day.isCurrentMonth ? 'bg-red-50' : ''
            }`}
          >
            {/* Date number */}
            <div className="flex items-center justify-between mb-1">
              <button
                onClick={() => handleDateClick(day.date)}
                className={`text-sm font-medium px-2 py-1 rounded-full ${
                  day.isToday
                    ? 'bg-blue-600 text-white'
                    : day.isCurrentMonth
                      ? 'text-gray-900 hover:bg-blue-100'
                      : 'text-gray-400'
                } ${
                  selectedDate?.toDateString() === day.date.toDateString()
                    ? 'ring-2 ring-blue-500'
                    : ''
                }`}
              >
                {day.date.getDate()}
              </button>
              
              {/* Add match button for admins on valid days */}
              {currentUser?.role === 'root' && 
               day.isCurrentMonth && 
               !day.isWeekend &&
               day.date > new Date() && (
                <button
                  onClick={() => handleDateClick(day.date)}
                  className="text-xs text-gray-400 hover:text-blue-600"
                  title="Créer un match"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </button>
              )}
            </div>

            {/* Matches for this day */}
            <div className="space-y-1">
              {day.matches.slice(0, 3).map((match) => (
                <div
                  key={match.id}
                  onClick={() => onMatchClick?.(match)}
                  className="cursor-pointer group"
                >
                  <div className={`text-xs p-1 rounded text-white ${getStatusColor(match.status)}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium">
                        {match.date.toLocaleTimeString('fr-FR', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      <span className="text-xs opacity-75">
                        {match._count?.matchPlayers || 0}/{match.maxPlayers}
                      </span>
                    </div>
                    {match.description && (
                      <div className="truncate text-xs opacity-90 mt-1">
                        {match.description}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {/* Show more indicator */}
              {day.matches.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{day.matches.length - 3} autres
                </div>
              )}
            </div>

            {/* Weekend indicator */}
            {day.isWeekend && day.isCurrentMonth && (
              <div className="mt-2 text-xs text-red-500 text-center">
                Weekend
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span className="text-gray-600">Ouvert</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-yellow-500"></div>
            <span className="text-gray-600">Complet</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span className="text-gray-600">Terminé</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-500"></div>
            <span className="text-gray-600">Annulé</span>
          </div>
        </div>
        
        <div className="mt-2 text-xs text-gray-500">
          • Les matchs ont lieu du lundi au vendredi de 12h à 14h uniquement
          {currentUser?.role === 'root' && (
            <span> • Cliquez sur + pour créer un match</span>
          )}
        </div>
      </div>
    </div>
  )
}

export default MatchCalendar