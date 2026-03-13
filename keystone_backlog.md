# Projet Keystone - État des Lieux & Backlog

Ce document synthétise l'architecture, ce qui est actuellement fonctionnel, et ce qui reste à développer (backlog) pour le projet **Keystone**. Ce fichier est destiné à faciliter la continuité du développement.

---

## 1. Présentation du Projet
**Keystone** est une application web de type **gestionnaire de secrets et de projets** (Vault), pensée pour le mode multi-locataire (multi-tenant) via un système d'**Organisations**. 

### Stack Technique
- **Framework** : Next.js 15 (App Router)
- **Base de données & Auth** : Supabase (`@supabase/ssr` / `@supabase/supabase-js`)
- **Styling** : Tailwind CSS v4, Radix UI (composants non stylés), `next-themes` pour le dark mode.
- **État Global** : Zustand (pour les favoris, récents)
- **Formulaires & Validation** : React Hook Form + Zod
- **Icônes** : Lucide React

---

## 2. Ce qui a été développé (Fonctionnel)

### Architecture et Système Core
- [x] **Authentification complète** : Logins, sessions gérées via Supabase et cookies.
- [x] **Multi-tenant (Organisations)** :
  - Création et sélection d'organisations.
  - Flux d'onboarding (`/onboarding`) redirigeant automatiquement les nouveaux utilisateurs sans organisation.
  - Sauvegarde du contexte de l'organisation active dans un cookie (`organization-cookie.ts`).
- [x] **Navigation & Shell** :
  - Sidebar et Topbar responsives incluant un switcher d'organisations.
  - Historique des visites (Récents) et Favoris sauvegardés localement via Zustand.
  - Recherche globale (type CMD+K via `global-search.tsx`) implémentée.

### Entités Métier (CRUD)
- [x] **Clients** (`/clients`) :
  - Liste, création, recherche et page de détail d'un client.
- [x] **Projets** :
  - Associés à un client. Actions serveurs complètes (CRUD). Page de détails d'un projet (`projects/[projectId]`).
- [x] **Secrets** (`/secrets`) :
  - Gestion avancée des secrets avec différents types supportés (Base de données, Serveur/SSH, FTP, CMS, API Keys, Autre).
  - Affichage conditionnel des champs (host, port, username, password, DB name, URL).
  - Composant `SecretValue` pour révéler/copier la valeur sécurisée.
  - Vue globale et filtrage de tous les secrets, ou secrets liés à un client/projet.
- [x] **Documents** (`/documents`) :
  - Intégration basique via un *iframe* Google Drive basé sur l'URL du dossier configuré dans les paramètres de l'organisation.

### Paramètres (Settings)
- [x] **Apparence** : Support du basculement Light/Dark mode.
- [x] **Sécurité (base)** : Cryptographie implémentée côté client/serveur pour les secrets (`lib/crypto/`, `vault.ts`).

---

## 3. Ce qui reste à développer (Backlog)

Voici la liste des fonctionnalités manquantes ou à améliorer pour finaliser l'outil :

### Priorité Haute (Sécurité & Droits)
- [ ] **Gestion fine des rôles et permissions (RBAC)** :
  - Hiérarchie au sein d'une organisation (Admin, Éditeur, Lecteur).
  - Possibilité de restreindre un utilisateur ou un groupe à certains *Clients* ou *Projets* (actuellement l'accès à l'organisation semble donner accès à tout).
- [ ] **Audit Trail (Journal d'activité)** :
  - Historique précis des actions critiques : qui a créé, modifié, supprimé ou **lu** un secret. Indispensable pour un Vault.
- [ ] **Gestion des Membres** :
  - Interface d'invitation (par email) d'utilisateurs dans une organisation (`members.ts` existe côté serveur mais le dashboard UI nécessite une passe).

### Priorité Moyenne (Fonctionnalités métier)
- [ ] **Dashboard Home (Vue d'ensemble)** :
  - Une véritable page d'accueil avec des métriques (nombre de secrets, derniers ajouts, activité de l'équipe).
- [ ] **Tags & Catégorisation** :
  - Possibilité d'ajouter des tags (ex: `#production`, `#staging`) sur les projets et les secrets pour filtrer plus finement.
- [ ] **Amélioration du module Documents** :
  - Actuellement c'est un Iframe Drive. À faire évoluer vers une vraie gestion de fichiers via le Storage de Supabase, ou une API OAuth Google Drive plus profonde (pour lier des fichiers à des projets/clients spécifiques, pas juste un dossier global).

### Priorité Basse (Polissage & SaaS)
- [ ] **Billing / Abonnements** (si applicable) :
  - Intégration Stripe pour limiter le nombre de clients/secrets selon le plan de l'organisation.
- [ ] **Notifications** :
  - Alertes lors de la mise à jour de mots de passe ou expiration (si la notion d'expiration est ajoutée).
  - Centre de notification in-app ou via email.
- [ ] **Partage Sécurisé Temporaire** :
  - Générer un lien chiffré et auto-destructructible d'un secret pour l'envoyer à un prestataire externe qui n'a pas de compte sur Keystone.

---

*Généré pour faciliter la reprise de contexte et le prompt de Claude.*
