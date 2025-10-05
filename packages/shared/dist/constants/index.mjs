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
export {
  SPORTS_CONFIG,
  getAllSports,
  getSportConfig
};
//# sourceMappingURL=index.mjs.map