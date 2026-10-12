'use strict';

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

exports.addDays = addDays;
exports.differenceInDays = differenceInDays;
exports.endOfDay = endOfDay;
exports.isFuture = isFuture;
exports.isPast = isPast;
exports.isToday = isToday;
exports.parseISODate = parseISODate;
exports.startOfDay = startOfDay;
exports.toISODateString = toISODateString;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map