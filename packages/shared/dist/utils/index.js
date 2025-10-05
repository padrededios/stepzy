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

// src/utils/index.ts
var utils_exports = {};
__export(utils_exports, {
  formatDate: () => formatDate,
  formatDateShort: () => formatDateShort,
  formatDateTime: () => formatDateTime,
  formatTime: () => formatTime,
  getTimeUntil: () => getTimeUntil,
  isFuture: () => isFuture,
  isPast: () => isPast,
  isToday: () => isToday
});
module.exports = __toCommonJS(utils_exports);

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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  getTimeUntil,
  isFuture,
  isPast,
  isToday
});
//# sourceMappingURL=index.js.map