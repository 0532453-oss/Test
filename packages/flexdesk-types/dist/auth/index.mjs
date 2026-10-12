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
export {
  UserRole,
  getRolePermissions
};
//# sourceMappingURL=index.mjs.map