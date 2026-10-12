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

// src/format/index.ts
function formatCurrency(amount, options = {}) {
  const {
    currency = "USD",
    locale = "en-US",
    minimumFractionDigits = 2,
    maximumFractionDigits = 2
  } = options;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(amount);
}
function formatNumber(value, locale = "en-US") {
  return new Intl.NumberFormat(locale).format(value);
}
function formatPercent(value, decimals = 0, locale = "en-US") {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(value);
}
function formatPhoneNumber(phone) {
  const cleaned = phone.replace(/\D/g, "");
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  }
  return phone;
}
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

// src/validation/index.ts
function isValidEmail(email) {
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
}
function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, "");
  return cleaned.length >= 10 && cleaned.length <= 15;
}
function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}
function isEmpty(value) {
  if (value === null || value === void 0) return true;
  if (typeof value === "string") return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === "object") return Object.keys(value).length === 0;
  return false;
}
function isValidUuid(uuid) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}
function isValidZipCode(zip) {
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}
function isValidLength(value, min, max) {
  const length = value.length;
  return length >= min && length <= max;
}
function isInRange(value, min, max) {
  return value >= min && value <= max;
}

// src/string/index.ts
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}
function toTitleCase(str) {
  return str.toLowerCase().split(" ").map((word) => capitalize(word)).join(" ");
}
function toCamelCase(str) {
  return str.toLowerCase().replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase());
}
function toSnakeCase(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1_$2").replace(/[\s-]+/g, "_").toLowerCase();
}
function toKebabCase(str) {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
}
function truncate(str, maxLength, suffix = "...") {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength - suffix.length) + suffix;
}
function removeWhitespace(str) {
  return str.replace(/\s+/g, "");
}
function getInitials(name, maxLength = 2) {
  return name.split(" ").map((word) => word.charAt(0).toUpperCase()).slice(0, maxLength).join("");
}
function pluralize(word, count, plural) {
  if (count === 1) return word;
  return plural || `${word}s`;
}
function slugify(str) {
  return str.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
}

exports.addDays = addDays;
exports.capitalize = capitalize;
exports.differenceInDays = differenceInDays;
exports.endOfDay = endOfDay;
exports.formatBytes = formatBytes;
exports.formatCurrency = formatCurrency;
exports.formatDuration = formatDuration;
exports.formatNumber = formatNumber;
exports.formatPercent = formatPercent;
exports.formatPhoneNumber = formatPhoneNumber;
exports.getInitials = getInitials;
exports.isEmpty = isEmpty;
exports.isFuture = isFuture;
exports.isInRange = isInRange;
exports.isPast = isPast;
exports.isToday = isToday;
exports.isValidEmail = isValidEmail;
exports.isValidLength = isValidLength;
exports.isValidPhone = isValidPhone;
exports.isValidUrl = isValidUrl;
exports.isValidUuid = isValidUuid;
exports.isValidZipCode = isValidZipCode;
exports.parseISODate = parseISODate;
exports.pluralize = pluralize;
exports.removeWhitespace = removeWhitespace;
exports.slugify = slugify;
exports.startOfDay = startOfDay;
exports.toCamelCase = toCamelCase;
exports.toISODateString = toISODateString;
exports.toKebabCase = toKebabCase;
exports.toSnakeCase = toSnakeCase;
exports.toTitleCase = toTitleCase;
exports.truncate = truncate;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map