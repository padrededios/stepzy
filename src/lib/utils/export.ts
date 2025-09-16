/**
 * Export Utilities for Match Data
 * Handles PDF and ICS calendar export functionality
 */

export interface MatchExportData {
  id: string
  date: Date
  maxPlayers: number
  description?: string
  status: 'open' | 'full' | 'completed' | 'cancelled'
  playerCount: number
  players?: Array<{
    pseudo: string
    joinedAt: Date
  }>
}

/**
 * Generates ICS calendar file content for matches
 */
export function generateICSContent(matches: MatchExportData[]): string {
  const now = new Date()
  const timestamp = now.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  
  let icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Futsal Club//Match Calendar//FR',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Matchs de Futsal`,
    `X-WR-CALDESC:Planning des matchs de futsal`,
    `X-WR-TIMEZONE:Europe/Paris`,
  ].join('\r\n')

  matches.forEach(match => {
    const event = generateICSEvent(match, timestamp)
    icsContent += '\r\n' + event
  })

  icsContent += '\r\nEND:VCALENDAR'
  return icsContent
}

function generateICSEvent(match: MatchExportData, timestamp: string): string {
  const startDate = new Date(match.date)
  const endDate = new Date(match.date.getTime() + 90 * 60 * 1000) // 90 minutes duration
  
  const formatDate = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const statusEmoji = {
    open: '🟢',
    full: '🟡', 
    completed: '✅',
    cancelled: '❌'
  }

  const summary = `${statusEmoji[match.status]} Futsal - ${match.playerCount}/${match.maxPlayers} joueurs`
  const description = [
    `Match de futsal`,
    `Participants: ${match.playerCount}/${match.maxPlayers}`,
    match.description ? `Description: ${match.description}` : '',
    `Statut: ${match.status}`,
    match.players && match.players.length > 0 ? 
      `\\n\\nJoueurs inscrits:\\n${match.players.map(p => `- ${p.pseudo}`).join('\\n')}` : ''
  ].filter(Boolean).join('\\n')

  return [
    'BEGIN:VEVENT',
    `UID:match-${match.id}@futsal.local`,
    `DTSTAMP:${timestamp}`,
    `DTSTART:${formatDate(startDate)}`,
    `DTEND:${formatDate(endDate)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:Terrain de Futsal`,
    `STATUS:${match.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
    `PRIORITY:${match.status === 'open' ? '5' : '3'}`,
    'END:VEVENT'
  ].join('\r\n')
}

/**
 * Generates PDF-ready HTML content for match planning
 */
export function generatePDFHTML(matches: MatchExportData[], title: string = 'Planning des Matchs'): string {
  const now = new Date()
  const formattedDate = now.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const matchesByWeek = groupMatchesByWeek(matches)

  let htmlContent = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        @page {
          margin: 2cm;
          size: A4;
        }
        
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 3px solid #2563eb;
          padding-bottom: 20px;
        }
        
        .header h1 {
          color: #2563eb;
          margin: 0;
          font-size: 28px;
        }
        
        .header p {
          margin: 10px 0 0 0;
          color: #666;
          font-size: 14px;
        }
        
        .week-section {
          margin-bottom: 40px;
          page-break-inside: avoid;
        }
        
        .week-title {
          background: linear-gradient(135deg, #2563eb, #1d4ed8);
          color: white;
          padding: 12px 20px;
          margin: 0 0 15px 0;
          font-size: 18px;
          font-weight: bold;
          border-radius: 6px;
        }
        
        .match-card {
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 15px;
          background: white;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .match-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }
        
        .match-date {
          font-size: 16px;
          font-weight: bold;
          color: #1f2937;
        }
        
        .match-status {
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .status-open { background: #dcfce7; color: #166534; }
        .status-full { background: #fef3c7; color: #92400e; }
        .status-completed { background: #dbeafe; color: #1e40af; }
        .status-cancelled { background: #fee2e2; color: #991b1b; }
        
        .match-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-bottom: 15px;
        }
        
        .info-item {
          font-size: 14px;
        }
        
        .info-label {
          font-weight: bold;
          color: #374151;
        }
        
        .players-section {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid #e5e7eb;
        }
        
        .players-list {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        
        .player-item {
          font-size: 13px;
          padding: 5px 10px;
          background: #f9fafb;
          border-radius: 4px;
        }
        
        .summary-section {
          margin-top: 40px;
          padding: 20px;
          background: #f9fafb;
          border-radius: 8px;
          border-left: 4px solid #2563eb;
        }
        
        .summary-title {
          font-size: 18px;
          font-weight: bold;
          color: #2563eb;
          margin-bottom: 15px;
        }
        
        .summary-stats {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 15px;
        }
        
        .stat-item {
          text-align: center;
          padding: 10px;
          background: white;
          border-radius: 6px;
        }
        
        .stat-number {
          font-size: 24px;
          font-weight: bold;
          color: #2563eb;
        }
        
        .stat-label {
          font-size: 12px;
          color: #666;
          text-transform: uppercase;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>🥅 ${title}</h1>
        <p>Généré le ${formattedDate}</p>
      </div>
  `

  // Add matches by week
  Object.entries(matchesByWeek).forEach(([weekTitle, weekMatches]) => {
    htmlContent += `
      <div class="week-section">
        <h2 class="week-title">${weekTitle}</h2>
    `

    weekMatches.forEach(match => {
      htmlContent += generateMatchCardHTML(match)
    })

    htmlContent += '</div>'
  })

  // Add summary
  const stats = calculateMatchStats(matches)
  htmlContent += `
    <div class="summary-section">
      <h3 class="summary-title">Résumé</h3>
      <div class="summary-stats">
        <div class="stat-item">
          <div class="stat-number">${stats.totalMatches}</div>
          <div class="stat-label">Total Matchs</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.openMatches}</div>
          <div class="stat-label">Ouverts</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.totalPlayers}</div>
          <div class="stat-label">Joueurs Inscrits</div>
        </div>
        <div class="stat-item">
          <div class="stat-number">${stats.averagePlayersPerMatch.toFixed(1)}</div>
          <div class="stat-label">Moy. Joueurs/Match</div>
        </div>
      </div>
    </div>
  `

  htmlContent += `
    </body>
    </html>
  `

  return htmlContent
}

function generateMatchCardHTML(match: MatchExportData): string {
  const matchDate = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(match.date)

  return `
    <div class="match-card">
      <div class="match-header">
        <div class="match-date">${matchDate}</div>
        <div class="match-status status-${match.status}">${match.status}</div>
      </div>
      
      <div class="match-info">
        <div class="info-item">
          <span class="info-label">Joueurs:</span> ${match.playerCount}/${match.maxPlayers}
        </div>
        <div class="info-item">
          <span class="info-label">Places restantes:</span> ${match.maxPlayers - match.playerCount}
        </div>
      </div>
      
      ${match.description ? `
        <div style="margin-bottom: 15px;">
          <span class="info-label">Description:</span> ${match.description}
        </div>
      ` : ''}
      
      ${match.players && match.players.length > 0 ? `
        <div class="players-section">
          <div class="info-label">Joueurs inscrits:</div>
          <div class="players-list">
            ${match.players.map(player => `
              <div class="player-item">${player.pseudo}</div>
            `).join('')}
          </div>
        </div>
      ` : ''}
    </div>
  `
}

function groupMatchesByWeek(matches: MatchExportData[]): Record<string, MatchExportData[]> {
  const grouped: Record<string, MatchExportData[]> = {}
  
  matches.forEach(match => {
    const weekStart = getWeekStart(match.date)
    const weekEnd = new Date(weekStart.getTime() + 6 * 24 * 60 * 60 * 1000)
    
    const weekTitle = `Semaine du ${weekStart.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    })} au ${weekEnd.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long'
    })}`
    
    if (!grouped[weekTitle]) {
      grouped[weekTitle] = []
    }
    
    grouped[weekTitle].push(match)
  })
  
  // Sort matches within each week
  Object.keys(grouped).forEach(week => {
    grouped[week].sort((a, b) => a.date.getTime() - b.date.getTime())
  })
  
  return grouped
}

function getWeekStart(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust for Monday start
  return new Date(d.setDate(diff))
}

function calculateMatchStats(matches: MatchExportData[]) {
  const totalMatches = matches.length
  const openMatches = matches.filter(m => m.status === 'open').length
  const totalPlayers = matches.reduce((sum, m) => sum + m.playerCount, 0)
  const averagePlayersPerMatch = totalMatches > 0 ? totalPlayers / totalMatches : 0

  return {
    totalMatches,
    openMatches,
    totalPlayers,
    averagePlayersPerMatch
  }
}

/**
 * Downloads content as a file
 */
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Exports matches as ICS calendar file
 */
export function exportMatchesToICS(matches: MatchExportData[]): void {
  const icsContent = generateICSContent(matches)
  const filename = `futsal-matches-${new Date().toISOString().split('T')[0]}.ics`
  downloadFile(icsContent, filename, 'text/calendar')
}

/**
 * Exports matches as PDF-ready HTML (to be processed by a PDF library)
 */
export function exportMatchesToPDF(matches: MatchExportData[], title?: string): string {
  return generatePDFHTML(matches, title)
}