// src/date/index.ts
function isToday(date) {
  const today = /* @__PURE__ */ new Date();
  return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
}
function isPast(date) {
  return date.getTime() < Date.now();
}
function isFuture(date) {
  return date.getTime() > Date.now();
}
function startOfDay(date) {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}
function endOfDay(date) {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}
function differenceInDays(dateA, dateB) {
  const diffTime = Math.abs(dateA.getTime() - dateB.getTime());
  return Math.ceil(diffTime / (1e3 * 60 * 60 * 24));
}
function toISODateString(date) {
  return date.toISOString().split("T")[0];
}
function parseISODate(dateString) {
  return new Date(dateString);
}

export { addDays, differenceInDays, endOfDay, isFuture, isPast, isToday, parseISODate, startOfDay, toISODateString };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map