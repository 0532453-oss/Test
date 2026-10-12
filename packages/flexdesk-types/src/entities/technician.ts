/**
 * Technician/Team Member entity types - aligned with Prisma schema
 */

export const TeamMemberRole = {
  ADMIN: 'ADMIN',
  TECHNICIAN: 'TECHNICIAN',
  DISPATCHER: 'DISPATCHER',
} as const;

export type TeamMemberRole = (typeof TeamMemberRole)[keyof typeof TeamMemberRole];

export const teamMemberRoleColors: Record<TeamMemberRole, string> = {
  [TeamMemberRole.ADMIN]: '#9b59b6',
  [TeamMemberRole.TECHNICIAN]: '#3498db',
  [TeamMemberRole.DISPATCHER]: '#27ae60',
};

export const teamMemberRoleChoices = [
  { id: TeamMemberRole.ADMIN, name: 'Admin' },
  { id: TeamMemberRole.TECHNICIAN, name: 'Technician' },
  { id: TeamMemberRole.DISPATCHER, name: 'Dispatcher' },
];

export interface Technician {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role: TeamMemberRole;
  isActive: boolean;
  color?: string | null;
  avatarUrl?: string | null;
  workspaceId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  deletedAt?: Date | string | null;
}

export interface TechnicianCreateInput {
  userId: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: TeamMemberRole;
  isActive?: boolean;
  color?: string | null;
  avatarUrl?: string | null;
}

export interface TechnicianUpdateInput extends Partial<TechnicianCreateInput> {
  id: string;
}

// Alias for backwards compatibility with frontend naming
export type TeamMember = Technician;
export type TeamMemberCreateInput = TechnicianCreateInput;
export type TeamMemberUpdateInput = TechnicianUpdateInput;
