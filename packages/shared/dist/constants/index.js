"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/constants/index.ts
var constants_exports = {};
__export(constants_exports, {
  SPORTS_CONFIG: () => SPORTS_CONFIG,
  getAllSports: () => getAllSports,
  getSportConfig: () => getSportConfig
});
module.exports = __toCommonJS(constants_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  SPORTS_CONFIG,
  getAllSports,
  getSportConfig
});
//# sourceMappingURL=index.js.map