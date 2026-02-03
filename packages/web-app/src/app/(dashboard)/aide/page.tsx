'use client'

import { useState } from 'react'
import Link from 'next/link'

interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
}

const faqItems: FAQItem[] = [
  // Créer une activité
  {
    id: 'create-activity-1',
    category: 'Créer une activité',
    question: 'Comment créer une nouvelle activité ?',
    answer: `Pour créer une nouvelle activité :
1. Cliquez sur le bouton "+ Nouvelle activité" depuis la page "Mes activités"
2. Remplissez les informations requises :
   - Nom de l'activité
   - Sport (football, badminton, volley, etc.)
   - Nombre minimum et maximum de joueurs
   - Horaires (heure de début et de fin)
   - Type de récurrence (hebdomadaire ou mensuel)
   - Jours de récurrence
3. Choisissez si l'activité est publique ou privée
4. Validez la création

Une fois créée, un code unique sera généré pour permettre aux autres joueurs de rejoindre votre activité.`
  },
  {
    id: 'create-activity-2',
    category: 'Créer une activité',
    question: 'Quelle est la différence entre une activité publique et privée ?',
    answer: `• Activité publique : Visible par tous les utilisateurs de Stepzy. N'importe qui peut voir et rejoindre l'activité.

• Activité privée : Visible uniquement par vous et les personnes à qui vous partagez le code de l'activité. Idéal pour des groupes fermés ou des événements entre amis.`
  },
  {
    id: 'create-activity-3',
    category: 'Créer une activité',
    question: 'Comment modifier ou supprimer une activité ?',
    answer: `Pour modifier ou supprimer une activité :
1. Allez dans "Mes activités"
2. Cliquez sur "Gestion" dans le menu ou sur l'icône de gestion de l'activité
3. Vous pourrez alors :
   - Modifier les informations de l'activité
   - Générer de nouvelles sessions
   - Voir les participants inscrits
   - Supprimer l'activité (attention : cette action est irréversible)`
  },
  // S'inscrire à une activité
  {
    id: 'join-activity-1',
    category: 'Rejoindre une activité',
    question: 'Comment rejoindre une activité existante ?',
    answer: `Il y a deux façons de rejoindre une activité :

1. Via le code d'activité :
   - Demandez le code de l'activité à l'organisateur
   - Entrez le code dans le champ "Rejoindre avec un code" sur la page "Mes activités"
   - Vous serez automatiquement inscrit à l'activité

2. Via les activités publiques :
   - Parcourez les activités publiques disponibles
   - Cliquez sur une activité pour voir ses détails
   - Cliquez sur "Rejoindre" pour vous inscrire`
  },
  {
    id: 'join-activity-2',
    category: 'Rejoindre une activité',
    question: 'Comment me désinscrire d\'une activité ?',
    answer: `Pour vous désinscrire d'une activité :
1. Allez dans "Mes activités"
2. Trouvez l'activité que vous souhaitez quitter
3. Cliquez sur le bouton "Quitter" ou l'icône de désinscription
4. Confirmez votre désinscription

Note : Si vous êtes le créateur de l'activité, vous devrez d'abord transférer la propriété ou supprimer l'activité.`
  },
  // Sessions
  {
    id: 'session-1',
    category: 'Sessions',
    question: 'Quelle est la différence entre une activité et une session ?',
    answer: `• Activité : C'est le cadre récurrent de vos matchs (ex: "Football du mardi soir"). Elle définit le sport, les horaires et la récurrence.

• Session : C'est une occurrence spécifique d'une activité (ex: "Match du mardi 15 janvier"). C'est à une session que vous vous inscrivez réellement pour jouer.

Une activité génère automatiquement des sessions selon sa récurrence (hebdomadaire ou mensuelle).`
  },
  {
    id: 'session-2',
    category: 'Sessions',
    question: 'Comment m\'inscrire à une session ?',
    answer: `Pour vous inscrire à une session :
1. Allez dans "Mes sessions" pour voir toutes les sessions à venir
2. Ou cliquez sur une activité pour voir ses sessions
3. Cliquez sur "Participer" ou "Je participe" sur la session souhaitée
4. Votre inscription sera confirmée si des places sont disponibles

Si toutes les places sont prises, vous serez mis en liste d'attente et serez notifié si une place se libère.`
  },
  {
    id: 'session-3',
    category: 'Sessions',
    question: 'Comment me désinscrire d\'une session ?',
    answer: `Pour vous désinscrire d'une session :
1. Allez dans "Mes sessions"
2. Trouvez la session concernée
3. Cliquez sur "Se désinscrire" ou "Annuler ma participation"
4. Confirmez votre désistement

Conseil : Désistez-vous le plus tôt possible pour permettre à quelqu'un en liste d'attente de prendre votre place !`
  },
  {
    id: 'session-4',
    category: 'Sessions',
    question: 'Comment voir qui participe à une session ?',
    answer: `Pour voir les participants d'une session :
1. Cliquez sur la session depuis "Mes sessions" ou depuis la page de l'activité
2. La liste des participants s'affiche avec :
   - Les joueurs confirmés
   - Les joueurs en liste d'attente
   - Le nombre de places restantes

Vous pouvez aussi voir les avatars des participants directement sur la carte de la session.`
  },
  // Notifications
  {
    id: 'notif-1',
    category: 'Notifications',
    question: 'Quelles notifications vais-je recevoir ?',
    answer: `Vous recevrez des notifications pour :
• Rappels de session (24h avant)
• Nouvelles sessions disponibles dans vos activités
• Confirmation ou annulation d'une session
• Place libérée si vous êtes en liste d'attente
• Messages dans les salons de discussion de vos activités
• Annonces importantes de Stepzy`
  },
  // Chat
  {
    id: 'chat-1',
    category: 'Discussion',
    question: 'Comment fonctionne le chat ?',
    answer: `Chaque activité dispose d'un salon de discussion :
• Accessible depuis l'icône de message dans le menu
• Permet de discuter avec tous les membres de l'activité
• Idéal pour coordonner les matchs, partager des infos, etc.

Les messages non lus sont indiqués par un badge sur l'icône de message.`
  },
  // Statistiques
  {
    id: 'stats-1',
    category: 'Statistiques',
    question: 'Comment sont calculées mes statistiques ?',
    answer: `Vos statistiques sont basées uniquement sur les sessions que vous avez jouées :
• Sessions jouées : Nombre de sessions terminées auxquelles vous avez participé
• Heures jouées : Temps total passé à jouer
• Taux de présence : Ratio sessions jouées / sessions inscrites
• Séries : Nombre de semaines consécutives où vous avez joué

Les badges et niveaux sont débloqués en fonction de votre progression !`
  }
]

const categories = [...new Set(faqItems.map(item => item.category))]

export default function AidePage() {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set())
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const toggleItem = (id: string) => {
    const newOpenItems = new Set(openItems)
    if (newOpenItems.has(id)) {
      newOpenItems.delete(id)
    } else {
      newOpenItems.add(id)
    }
    setOpenItems(newOpenItems)
  }

  const filteredItems = selectedCategory
    ? faqItems.filter(item => item.category === selectedCategory)
    : faqItems

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Créer une activité': return '➕'
      case 'Rejoindre une activité': return '🤝'
      case 'Sessions': return '📅'
      case 'Notifications': return '🔔'
      case 'Discussion': return '💬'
      case 'Statistiques': return '📊'
      default: return '❓'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl font-bold mb-4">Centre d'aide</h1>
          <p className="text-lg text-indigo-100">
            Trouvez rapidement des réponses à vos questions sur l'utilisation de Stepzy
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Quick actions */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              href="/mes-activites"
              className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="text-3xl mb-2">➕</span>
              <span className="text-sm font-medium text-green-700">Créer une activité</span>
            </Link>
            <Link
              href="/mes-sessions"
              className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <span className="text-3xl mb-2">📅</span>
              <span className="text-sm font-medium text-blue-700">Voir mes sessions</span>
            </Link>
            <Link
              href="/messages"
              className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="text-3xl mb-2">💬</span>
              <span className="text-sm font-medium text-purple-700">Mes discussions</span>
            </Link>
            <Link
              href="/mes-statistiques"
              className="flex flex-col items-center p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="text-3xl mb-2">📊</span>
              <span className="text-sm font-medium text-orange-700">Mes statistiques</span>
            </Link>
          </div>
        </div>

        {/* Category filters */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Filtrer par catégorie</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === null
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              Toutes
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {getCategoryIcon(category)} {category}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4">
          {filteredItems.map(item => (
            <div
              key={item.id}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
            >
              <button
                onClick={() => toggleItem(item.id)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center space-x-3 text-left">
                  <span className="text-xl">{getCategoryIcon(item.category)}</span>
                  <div>
                    <span className="text-xs text-indigo-600 font-medium uppercase tracking-wide">
                      {item.category}
                    </span>
                    <h3 className="font-medium text-gray-900">{item.question}</h3>
                  </div>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    openItems.has(item.id) ? 'rotate-180' : ''
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {openItems.has(item.id) && (
                <div className="px-6 pb-4 border-t border-gray-100">
                  <div className="pt-4 pl-9 text-gray-600 whitespace-pre-wrap">
                    {item.answer}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Contact section */}
        <div className="mt-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white text-center">
          <h2 className="text-xl font-bold mb-2">Vous n'avez pas trouvé votre réponse ?</h2>
          <p className="text-indigo-100 mb-4">
            N'hésitez pas à nous contacter pour toute question supplémentaire
          </p>
          <a
            href="mailto:support@stepzy.fr"
            className="inline-flex items-center px-6 py-3 bg-white text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Nous contacter
          </a>
        </div>
      </div>
    </div>
  )
}
