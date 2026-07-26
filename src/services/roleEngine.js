

const ROLE_PERMISSIONS = {
  OWNER: {
    canManageWorkspace: true,
    canManageBilling: true,
    canManageUsers: true,
    canDeleteInvoices: true,
    canEditInvoices: true,
    canCreateInvoices: true,
    canViewInvoices: true,
    canManageSettings: true
  },
  ADMIN: {
    canManageWorkspace: false,
    canManageBilling: false,
    canManageUsers: true,
    canDeleteInvoices: true,
    canEditInvoices: true,
    canCreateInvoices: true,
    canViewInvoices: true,
    canManageSettings: true
  },
  STAFF: {
    canManageWorkspace: false,
    canManageBilling: false,
    canManageUsers: false,
    canDeleteInvoices: false,
    canEditInvoices: true,
    canCreateInvoices: true,
    canViewInvoices: true,
    canManageSettings: false
  },
  VIEWER: {
    canManageWorkspace: false,
    canManageBilling: false,
    canManageUsers: false,
    canDeleteInvoices: false,
    canEditInvoices: false,
    canCreateInvoices: false,
    canViewInvoices: true,
    canManageSettings: false
  }
};

class RoleEngine {
  async getUserRole(workspaceId, userId) {
    // Queries the workspace document for the user's role
    // Mock implementation for now, assuming Owner
    return 'OWNER';
  }

  async hasPermission(workspaceId, userId, permissionKey) {
    const role = await this.getUserRole(workspaceId, userId);
    if (!role) return false;
    
    const permissions = ROLE_PERMISSIONS[role.toUpperCase()];
    if (!permissions) return false;
    
    return !!permissions[permissionKey];
  }

  getRolePermissions(roleName) {
    return ROLE_PERMISSIONS[roleName.toUpperCase()] || ROLE_PERMISSIONS.VIEWER;
  }
  
  async enforcePermission(workspaceId, userId, permissionKey) {
    const allowed = await this.hasPermission(workspaceId, userId, permissionKey);
    if (!allowed) {
      throw new Error(`Access Denied: Requires ${permissionKey}`);
    }
    return true;
  }
}

export const roleEngine = new RoleEngine();
