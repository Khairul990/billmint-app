// src/state/userSettings.ts

export interface Workspace {
  id: string;
  name: string;
  type: string; // e.g., 'doctor', 'retail', 'custom'
  enabledModules: string[]; // list of module keys
  isActive?: boolean; // for archive handling
}

export interface UserSettings {
  // existing settings fields are kept as is (any)
  [key: string]: any;
  businessWorkspaces?: Workspace[];
  activeWorkspaceId?: string;
}
