-- Migration: Rendre organization_id optionnel sur les secrets
-- Permet aux utilisateurs de créer des secrets personnels sans organisation

-- Rendre organization_id nullable
ALTER TABLE secrets ALTER COLUMN organization_id DROP NOT NULL;

-- Index pour les requêtes de secrets personnels (par créateur)
CREATE INDEX IF NOT EXISTS idx_secrets_created_by ON secrets(created_by);

-- Index composite pour les requêtes de secrets personnels non supprimés
CREATE INDEX IF NOT EXISTS idx_secrets_personal ON secrets(created_by, deleted_at) WHERE organization_id IS NULL;

-- Index pour les requêtes de secrets par organisation (filtre deleted_at)
CREATE INDEX IF NOT EXISTS idx_secrets_org_deleted ON secrets(organization_id, deleted_at) WHERE deleted_at IS NULL;

-- Index pour les requêtes de secrets personnels par créateur (filtre deleted_at)
CREATE INDEX IF NOT EXISTS idx_secrets_created_by_deleted ON secrets(created_by, deleted_at) WHERE deleted_at IS NULL;
