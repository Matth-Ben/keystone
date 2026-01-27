export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            profiles: {
                Row: {
                    id: string
                    full_name: string | null
                    avatar_url: string | null
                    updated_at: string
                }
                Insert: {
                    id: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string
                }
                Update: {
                    id?: string
                    full_name?: string | null
                    avatar_url?: string | null
                    updated_at?: string
                }
            }
            organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    owner_id: string
                    created_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    name: string
                    slug: string
                    owner_id: string
                    created_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    name?: string
                    slug?: string
                    owner_id?: string
                    created_at?: string
                    deleted_at?: string | null
                }
            }
            organization_members: {
                Row: {
                    id: string
                    organization_id: string
                    user_id: string
                    role: Database['public']['Enums']['member_role']
                    joined_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    user_id: string
                    role?: Database['public']['Enums']['member_role']
                    joined_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    user_id?: string
                    role?: Database['public']['Enums']['member_role']
                    joined_at?: string
                }
            }
            invitations: {
                Row: {
                    id: string
                    organization_id: string
                    email: string
                    role: Database['public']['Enums']['member_role']
                    invited_by: string
                    status: Database['public']['Enums']['invitation_status']
                    token: string
                    expires_at: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    email: string
                    role?: Database['public']['Enums']['member_role']
                    invited_by: string
                    status?: Database['public']['Enums']['invitation_status']
                    token?: string
                    expires_at?: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    email?: string
                    role?: Database['public']['Enums']['member_role']
                    invited_by?: string
                    status?: Database['public']['Enums']['invitation_status']
                    token?: string
                    expires_at?: string
                    created_at?: string
                }
            }
            clients: {
                Row: {
                    id: string
                    organization_id: string
                    name: string
                    logo_url: string | null
                    website: string | null
                    contact_email: string | null
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    organization_id: string
                    name: string
                    logo_url?: string | null
                    website?: string | null
                    contact_email?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    organization_id?: string
                    name?: string
                    logo_url?: string | null
                    website?: string | null
                    contact_email?: string | null
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
            }
            projects: {
                Row: {
                    id: string
                    client_id: string
                    name: string
                    status: Database['public']['Enums']['project_status']
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    client_id: string
                    name: string
                    status?: Database['public']['Enums']['project_status']
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    client_id?: string
                    name?: string
                    status?: Database['public']['Enums']['project_status']
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
            }
            secrets: {
                Row: {
                    id: string
                    project_id: string
                    type: Database['public']['Enums']['secret_type']
                    title: string
                    username: string | null
                    encrypted_password: string
                    host: string | null
                    port: number | null
                    url: string | null
                    db_name: string | null
                    tags: string[]
                    notes: string | null
                    created_by: string
                    created_at: string
                    updated_at: string
                    deleted_at: string | null
                }
                Insert: {
                    id?: string
                    project_id: string
                    type: Database['public']['Enums']['secret_type']
                    title: string
                    username?: string | null
                    encrypted_password: string
                    host?: string | null
                    port?: number | null
                    url?: string | null
                    db_name?: string | null
                    tags?: string[]
                    notes?: string | null
                    created_by: string
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
                Update: {
                    id?: string
                    project_id?: string
                    type?: Database['public']['Enums']['secret_type']
                    title?: string
                    username?: string | null
                    encrypted_password?: string
                    host?: string | null
                    port?: number | null
                    url?: string | null
                    db_name?: string | null
                    tags?: string[]
                    notes?: string | null
                    created_by?: string
                    created_at?: string
                    updated_at?: string
                    deleted_at?: string | null
                }
            }
            quick_links: {
                Row: {
                    id: string
                    client_id: string
                    title: string
                    url: string
                    type: Database['public']['Enums']['link_type']
                    created_at: string
                }
                Insert: {
                    id?: string
                    client_id: string
                    title: string
                    url: string
                    type: Database['public']['Enums']['link_type']
                    created_at?: string
                }
                Update: {
                    id?: string
                    client_id?: string
                    title?: string
                    url?: string
                    type?: Database['public']['Enums']['link_type']
                    created_at?: string
                }
            }
            favorites: {
                Row: {
                    id: string
                    user_id: string
                    resource_type: Database['public']['Enums']['resource_type']
                    resource_id: string
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    resource_type: Database['public']['Enums']['resource_type']
                    resource_id: string
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    resource_type?: Database['public']['Enums']['resource_type']
                    resource_id?: string
                    created_at?: string
                }
            }
            audit_logs: {
                Row: {
                    id: string
                    organization_id: string
                    user_id: string | null
                    action: string
                    resource: string
                    resource_id: string | null
                    metadata: Json | null
                    ip_address: string | null
                    user_agent: string | null
                    timestamp: string
                }
                Insert: {
                    id?: string
                    organization_id: string
                    user_id?: string | null
                    action: string
                    resource: string
                    resource_id?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    timestamp?: string
                }
                Update: {
                    id?: string
                    organization_id?: string
                    user_id?: string | null
                    action?: string
                    resource?: string
                    resource_id?: string | null
                    metadata?: Json | null
                    ip_address?: string | null
                    user_agent?: string | null
                    timestamp?: string
                }
            }
        }
        Views: {
            user_organizations: {
                Row: {
                    id: string
                    name: string
                    slug: string
                    role: Database['public']['Enums']['member_role']
                    joined_at: string
                }
            }
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            member_role: 'admin' | 'member' | 'restricted'
            project_status: 'active' | 'archived'
            secret_type: 'ssh' | 'ftp' | 'db' | 'cms' | 'api' | 'other'
            link_type: 'figma' | 'repo' | 'dev' | 'prod' | 'other'
            resource_type: 'project' | 'client'
            invitation_status: 'pending' | 'accepted' | 'declined' | 'expired'
        }
    }
}
