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
export {
  formatDate,
  formatDateShort,
  formatDateTime,
  formatTime,
  getTimeUntil,
  isFuture,
  isPast,
  isToday
};
//# sourceMappingURL=index.mjs.map