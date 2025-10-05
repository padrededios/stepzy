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

// src/types/index.ts
var types_exports = {};
__export(types_exports, {
  DAY_LABELS: () => DAY_LABELS,
  PARTICIPANT_STATUS_LABELS: () => PARTICIPANT_STATUS_LABELS,
  RECURRING_TYPE_LABELS: () => RECURRING_TYPE_LABELS
});
module.exports = __toCommonJS(types_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DAY_LABELS,
  PARTICIPANT_STATUS_LABELS,
  RECURRING_TYPE_LABELS
});
//# sourceMappingURL=index.js.map