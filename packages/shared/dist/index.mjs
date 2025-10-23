// src/types/activity.ts
var DAY_LABELS = {
  monday: "Lundi",
  tuesday: "Mardi",
  wednesday: "Mercredi",
  thursday: "Jeudi",
  friday: "Vendredi",
  saturday: "Samedi",
  sunday: "Dimanche"
};
var RECURRING_TYPE_LABELS = {
  weekly: "Chaque semaine",
  monthly: "Chaque mois"
};
var PARTICIPANT_STATUS_LABELS = {
  interested: "Int\xE9ress\xE9",
  confirmed: "Confirm\xE9",
  waiting: "En attente"
};

// src/constants/sports.ts
var SPORTS_CONFIG = {
  football: {
    id: "football",
    name: "Football",
    icon: "/images/fox_football.jpg",
    maxPlayers: 12,
    minPlayers: 8,
    description: "Match de football \xE0 5 contre 5 avec rempla\xE7ants",
    color: "bg-green-500"
  },
  badminton: {
    id: "badminton",
    name: "Badminton",
    icon: "/images/fox_badminton.png",
    maxPlayers: 4,
    minPlayers: 2,
    description: "Parties de badminton en simple ou double",
    color: "bg-yellow-500"
  },
  volley: {
    id: "volley",
    name: "Volleyball",
    icon: "/images/fox_volley.png",
    maxPlayers: 12,
    minPlayers: 6,
    description: "Match de volleyball 6 contre 6",
    color: "bg-orange-500"
  },
  pingpong: {
    id: "pingpong",
    name: "Ping-Pong",
    icon: "/images/fox_pingpong.png",
    maxPlayers: 4,
    minPlayers: 2,
    description: "Tournoi de ping-pong en simple ou double",
    color: "bg-red-500"
  },
  rugby: {
    id: "rugby",
    name: "Rugby",
    icon: "/images/fox_rugbypng.png",
    maxPlayers: 15,
    minPlayers: 10,
    description: "Match de rugby \xE0 XV",
    color: "bg-purple-500"
  }
};
var getSportConfig = (sport) => {
  return SPORTS_CONFIG[sport];
};
var getAllSports = () => {
  return Object.values(SPORTS_CONFIG);
};

// src/utils/date.ts
var formatDate = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  }).format(d);
};
var formatTime = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
};
var formatDateTime = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  }).format(d);
};
var formatDateShort = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric"
  }).format(d);
};
var isToday = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const today = /* @__PURE__ */ new Date();
  return d.toDateString() === today.toDateString();
};
var isFuture = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() > Date.now();
};
var isPast = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.getTime() < Date.now();
};
var getTimeUntil = (date) => {
  const d = typeof date === "string" ? new Date(date) : date;
  const now = /* @__PURE__ */ new Date();
  const diff = d.getTime() - now.getTime();
  if (diff <= 0) return null;
  const minutes = Math.floor(diff / (1e3 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `Dans ${days} jour${days > 1 ? "s" : ""}`;
  if (hours > 0) return `Dans ${hours}h${minutes % 60 > 0 ? minutes % 60 + "min" : ""}`;
  if (minutes > 0) return `Dans ${minutes} minute${minutes > 1 ? "s" : ""}`;
  return "Bient\xF4t";
};

// src/utils/code.ts
function generateActivityCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }
  return code;
}
function isValidActivityCode(code) {
  const codeRegex = /^[A-Z0-9]{8}$/;
  return codeRegex.test(code);
}
function formatActivityCode(code) {
  if (!isValidActivityCode(code)) {
    return code;
  }
  return `${code.slice(0, 4)} ${code.slice(4)}`;
}
function sanitizeActivityCode(input) {
  return input.replace(/\s/g, "").toUpperCase();
}
export {
  DAY_LABELS,
  PARTICIPANT_STATUS_LABELS,
  RECURRING_TYPE_LABELS,
  SPORTS_CONFIG,
  formatActivityCode,
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  generateActivityCode,
  getAllSports,
  getSportConfig,
  getTimeUntil,
  isFuture,
  isPast,
  isToday,
  isValidActivityCode,
  sanitizeActivityCode
};
//# sourceMappingURL=index.mjs.map