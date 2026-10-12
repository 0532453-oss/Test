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

// src/auth/index.ts
var auth_exports = {};
__export(auth_exports, {
  UserRole: () => UserRole,
  getRolePermissions: () => getRolePermissions
});
module.exports = __toCommonJS(auth_exports);

// src/auth/user.ts
var UserRole = {
  OWNER: "OWNER",
  ADMIN: "ADMIN",
  MEMBER: "MEMBER"
};
function getRolePermissions(role) {
  switch (role) {
    case UserRole.OWNER:
      return {
        canManageWorkspace: true,
        canManageUsers: true,
        canManageJobs: true,
        canManageCustomers: true,
        canManageInvoices: true,
        canViewReports: true
      };
    case UserRole.ADMIN:
      return {
        canManageWorkspace: false,
        canManageUsers: true,
        canManageJobs: true,
        canManageCustomers: true,
        canManageInvoices: true,
        canViewReports: true
      };
    case UserRole.MEMBER:
      return {
        canManageWorkspace: false,
        canManageUsers: false,
        canManageJobs: true,
        canManageCustomers: true,
        canManageInvoices: false,
        canViewReports: false
      };
    default:
      return {
        canManageWorkspace: false,
        canManageUsers: false,
        canManageJobs: false,
        canManageCustomers: false,
        canManageInvoices: false,
        canViewReports: false
      };
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  UserRole,
  getRolePermissions
});
//# sourceMappingURL=index.js.map