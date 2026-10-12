'use strict';

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

exports.capitalize = capitalize;
exports.getInitials = getInitials;
exports.pluralize = pluralize;
exports.removeWhitespace = removeWhitespace;
exports.slugify = slugify;
exports.toCamelCase = toCamelCase;
exports.toKebabCase = toKebabCase;
exports.toSnakeCase = toSnakeCase;
exports.toTitleCase = toTitleCase;
exports.truncate = truncate;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map