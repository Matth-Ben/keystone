import { Database } from '@/types/supabase'

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// Types principaux
export type Profile = Tables<'profiles'>
export type Organization = Tables<'organizations'>
export type OrganizationMember = Tables<'organization_members'>
export type Client = Tables<'clients'>
export type Project = Tables<'projects'>
export type Secret = Tables<'secrets'>
export type QuickLink = Tables<'quick_links'>
export type Favorite = Tables<'favorites'>
export type AuditLog = Tables<'audit_logs'>
export type Invitation = Tables<'invitations'>

// Enums
export type MemberRole = Enums<'member_role'>
export type ProjectStatus = Enums<'project_status'>
export type SecretType = Enums<'secret_type'>
export type LinkType = Enums<'link_type'>
export type ResourceType = Enums<'resource_type'>
export type InvitationStatus = Enums<'invitation_status'>

// Types étendus avec relations
export type ClientWithProjects = Client & {
  projects: Project[]
  quick_links: QuickLink[]
}

export type ProjectWithSecrets = Project & {
  secrets: Secret[]
  client: Client
}

export type SecretWithProject = Secret & {
  project: Project & {
    client: Client
  }
}

export type OrganizationWithMembers = Organization & {
  organization_members: (OrganizationMember & {
    profiles: Profile
  })[]
}

// Types pour les formulaires
export type CreateClientInput = Pick<Client, 'name' | 'website' | 'contact_email'> & {
  logo_url?: string
}

export type CreateProjectInput = Pick<Project, 'name' | 'client_id'>

export type CreateSecretInput = Omit<Secret, 'id' | 'created_at' | 'updated_at' | 'deleted_at' | 'created_by'>

export type CreateQuickLinkInput = Pick<QuickLink, 'title' | 'url' | 'type' | 'client_id'>

export type InviteMemberInput = Pick<Invitation, 'email' | 'role'>
