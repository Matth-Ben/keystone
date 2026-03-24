"use client";

import { useState, useMemo, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import {
  ChevronRight,
  ChevronDown,
  FolderClosed,
  FolderOpen,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  GripVertical,
  Server,
  Database,
  Key,
  FileText,
  Globe,
  Folder,
  Building2,
  Search,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  moveSecretToFolder,
  moveSecretToClient,
  deleteFolder,
  reorderFolders,
} from "@/lib/actions/folders";
import { CreateFolderDialog } from "./create-folder-dialog";
import { SecretDetailPanel } from "./secret-detail-panel";
import { CreateSecretDialog } from "./create-secret-dialog";
import { deleteSecret, Secret, SecretType } from "@/lib/actions/secrets";

import type { Client } from "@/lib/actions/clients";
import type { SecretFolder } from "@/lib/actions/folders";
import type { OrgRole } from "@/lib/rbac";

const TYPE_ICONS: Record<SecretType, any> = {
  db: Database,
  ssh: Server,
  ftp: Folder,
  cms: Globe,
  api: Key,
  other: FileText,
};

interface SecretWithRelations extends Secret {
  clients?: { id: string; name: string } | null;
}

interface SecretsPageContentProps {
  secrets: SecretWithRelations[];
  folders: SecretFolder[];
  clients: Client[];
  organizationId: string;
  role: OrgRole;
}

// Sortable custom folder component
function SortableFolder({
  folder,
  secrets,
  isExpanded,
  onToggle,
  onEdit,
  onDelete,
  onSecretClick,
  selectedSecretId,
  canWrite,
  canDeleteFolder,
  isDraggingOver,
}: {
  folder: SecretFolder;
  secrets: SecretWithRelations[];
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSecretClick: (secret: SecretWithRelations) => void;
  selectedSecretId: string | null;
  canWrite: boolean;
  canDeleteFolder: boolean;
  isDraggingOver: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `folder-${folder.id}`,
    data: { type: "folder", folder },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "rounded-lg border bg-card transition-all group",
        isDragging && "opacity-50 shadow-lg",
        isDraggingOver && "ring-2 ring-primary ring-inset bg-primary/5",
      )}
    >
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        {canWrite && (
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        )}

        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          {isExpanded ? (
            <FolderOpen
              className="h-5 w-5 shrink-0"
              style={{ color: folder.color || undefined }}
            />
          ) : (
            <FolderClosed
              className="h-5 w-5 shrink-0"
              style={{ color: folder.color || undefined }}
            />
          )}
          <span className="font-medium truncate">{folder.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {secrets.length}
          </span>
        </div>

        {canWrite && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Modifier
              </DropdownMenuItem>
              {canDeleteFolder && (
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                  }}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Supprimer
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {isExpanded && (
        <div className="border-t px-3 pb-3">
          {secrets.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              Glissez des secrets ici
            </p>
          ) : (
            <div className="space-y-1 pt-2">
              {secrets.map((secret) => (
                <DraggableSecret
                  key={secret.id}
                  secret={secret}
                  isSelected={selectedSecretId === secret.id}
                  onClick={() => onSecretClick(secret)}
                  canDrag={canWrite}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Client folder (auto-generated, not sortable but droppable)
function ClientFolder({
  client,
  secrets,
  isExpanded,
  onToggle,
  onSecretClick,
  selectedSecretId,
  canWrite,
  isDraggingOver,
}: {
  client: Client;
  secrets: SecretWithRelations[];
  isExpanded: boolean;
  onToggle: () => void;
  onSecretClick: (secret: SecretWithRelations) => void;
  selectedSecretId: string | null;
  canWrite: boolean;
  isDraggingOver: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `client-${client.id}`,
    data: { type: "client", client },
  });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-lg border bg-card/50 transition-all",
        (isDraggingOver || isOver) &&
          "ring-2 ring-primary ring-inset bg-primary/5",
      )}
    >
      <div
        className="flex items-center gap-2 p-3 cursor-pointer hover:bg-muted/50"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
          )}
          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10 text-xs font-semibold overflow-hidden">
            {client.logo ? (
              <img
                src={client.logo}
                alt={client.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <Building2 className="h-4 w-4 text-primary" />
            )}
          </div>
          <span className="font-medium truncate">{client.name}</span>
          <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {secrets.length}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t px-3 pb-3">
          <div className="space-y-1 pt-2">
            {secrets.map((secret) => (
              <DraggableSecret
                key={secret.id}
                secret={secret}
                isSelected={selectedSecretId === secret.id}
                onClick={() => onSecretClick(secret)}
                canDrag={canWrite}
                showClient={false}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Draggable secret item
function DraggableSecret({
  secret,
  isSelected,
  onClick,
  canDrag,
  showClient = true,
}: {
  secret: SecretWithRelations;
  isSelected: boolean;
  onClick: () => void;
  canDrag: boolean;
  showClient?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `secret-${secret.id}`,
    data: { type: "secret", secret },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = TYPE_ICONS[secret.type] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
        isSelected ? "bg-primary/10 border border-primary" : "hover:bg-muted",
        isDragging && "opacity-50 shadow-lg bg-card border",
      )}
    >
      {canDrag && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3" />
        </div>
      )}
      <div
        className={cn(
          "rounded p-1.5",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-3 w-3" />
      </div>
      <span className="text-sm font-medium truncate">{secret.title}</span>
      {showClient && secret.clients?.name && (
        <span className="text-xs text-muted-foreground truncate">
          — {secret.clients.name}
        </span>
      )}
    </div>
  );
}

// Loose secret (standalone card, not in a folder)
function LooseSecret({
  secret,
  isSelected,
  onClick,
  canDrag,
}: {
  secret: SecretWithRelations;
  isSelected: boolean;
  onClick: () => void;
  canDrag: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `secret-${secret.id}`,
    data: { type: "secret", secret },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = TYPE_ICONS[secret.type] || FileText;

  return (
    <div
      ref={setNodeRef}
      style={style}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg border bg-card cursor-pointer transition-all",
        isSelected
          ? "border-primary bg-primary/5 shadow-md"
          : "hover:shadow-md hover:border-primary/20",
        isDragging && "opacity-50 shadow-lg",
      )}
    >
      {canDrag && (
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </div>
      )}
      <div
        className={cn(
          "rounded-lg p-2",
          isSelected
            ? "bg-primary text-primary-foreground"
            : "bg-primary/10 text-primary",
        )}
      >
        <Icon className="h-4 w-4" />
      </div>
      <span className="font-medium">{secret.title}</span>
    </div>
  );
}

export function SecretsPageContent({
  secrets,
  folders,
  clients,
  organizationId,
  role,
}: SecretsPageContentProps) {
  const canWrite = role !== "restricted";
  const canDeleteFolder = role === "admin";

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );
  const [expandedClients, setExpandedClients] = useState<Set<string>>(
    new Set(),
  );
  const [selectedSecret, setSelectedSecret] =
    useState<SecretWithRelations | null>(null);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  const [activeType, setActiveType] = useState<"folder" | "secret" | null>(
    null,
  );
  const [overId, setOverId] = useState<UniqueIdentifier | null>(null);
  const [search, setSearch] = useState("");

  // Dialogs
  const [createFolderOpen, setCreateFolderOpen] = useState(false);
  const [folderToEdit, setFolderToEdit] = useState<SecretFolder | undefined>();
  const [folderToDelete, setFolderToDelete] = useState<
    SecretFolder | undefined
  >();
  const [createSecretOpen, setCreateSecretOpen] = useState(false);
  const [secretToEdit, setSecretToEdit] = useState<Secret | undefined>();
  const [secretToDelete, setSecretToDelete] = useState<Secret | undefined>();

  // Local folder order (for optimistic updates)
  const [localFolderOrder, setLocalFolderOrder] = useState<string[]>(
    folders.map((f) => f.id),
  );

  // Sync local folder order when folders change (new folder created, deleted, etc.)
  useEffect(() => {
    const currentIds = new Set(localFolderOrder);
    const newIds = folders.map((f) => f.id);

    // Check if there are new folders or removed folders
    const hasNewFolders = newIds.some((id) => !currentIds.has(id));
    const hasRemovedFolders = localFolderOrder.some(
      (id) => !newIds.includes(id),
    );

    if (hasNewFolders || hasRemovedFolders) {
      // Keep existing order for folders that still exist, add new ones at the end
      const existingOrder = localFolderOrder.filter((id) =>
        newIds.includes(id),
      );
      const newFolders = newIds.filter((id) => !currentIds.has(id));
      setLocalFolderOrder([...existingOrder, ...newFolders]);
    }
  }, [folders]);

  // Group secrets
  const { secretsByFolder, secretsByClient, looseSecrets } = useMemo(() => {
    const byFolder = new Map<string, SecretWithRelations[]>();
    const byClient = new Map<string, SecretWithRelations[]>();
    const loose: SecretWithRelations[] = [];

    secrets.forEach((secret) => {
      if (secret.folder_id) {
        // Secret in a custom folder
        if (!byFolder.has(secret.folder_id)) {
          byFolder.set(secret.folder_id, []);
        }
        byFolder.get(secret.folder_id)!.push(secret);
      } else if (secret.client_id) {
        // Secret with client but no folder -> client auto-folder
        if (!byClient.has(secret.client_id)) {
          byClient.set(secret.client_id, []);
        }
        byClient.get(secret.client_id)!.push(secret);
      } else {
        // Secret without folder and without client
        loose.push(secret);
      }
    });

    return {
      secretsByFolder: byFolder,
      secretsByClient: byClient,
      looseSecrets: loose,
    };
  }, [secrets]);

  // Clients with secrets (for auto-folders)
  const clientsWithSecrets = useMemo(() => {
    return clients.filter((c) => secretsByClient.has(c.id));
  }, [clients, secretsByClient]);

  // Ordered folders
  const orderedFolders = useMemo(() => {
    return localFolderOrder
      .map((id) => folders.find((f) => f.id === id))
      .filter((f): f is SecretFolder => !!f);
  }, [folders, localFolderOrder]);

  // Search filter
  const filteredLooseSecrets = useMemo(() => {
    if (!search.trim()) return looseSecrets;
    const terms = search
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t.length > 0);
    return looseSecrets.filter((secret) => {
      const searchable = [
        secret.title,
        secret.username,
        secret.host,
        secret.notes,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return terms.every((term) => searchable.includes(term));
    });
  }, [looseSecrets, search]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const toggleClient = (clientId: string) => {
    setExpandedClients((prev) => {
      const next = new Set(prev);
      if (next.has(clientId)) {
        next.delete(clientId);
      } else {
        next.add(clientId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id);

    const idStr = String(active.id);
    if (idStr.startsWith("folder-")) {
      setActiveType("folder");
    } else if (idStr.startsWith("secret-")) {
      setActiveType("secret");
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id || null);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveType(null);
    setOverId(null);

    if (!over || active.id === over.id) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    // Reordering folders
    if (activeIdStr.startsWith("folder-") && overIdStr.startsWith("folder-")) {
      const activeFolderId = activeIdStr.replace("folder-", "");
      const overFolderId = overIdStr.replace("folder-", "");

      const oldIndex = localFolderOrder.indexOf(activeFolderId);
      const newIndex = localFolderOrder.indexOf(overFolderId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(localFolderOrder, oldIndex, newIndex);
        setLocalFolderOrder(newOrder);

        try {
          await reorderFolders(organizationId, newOrder);
        } catch (error: any) {
          setLocalFolderOrder(localFolderOrder);
          toast.error(error.message || "Erreur lors du réordonnancement");
        }
      }
      return;
    }

    // Moving secret to folder or client
    if (activeIdStr.startsWith("secret-")) {
      const secretId = activeIdStr.replace("secret-", "");
      const currentSecret = secrets.find((s) => s.id === secretId);
      if (!currentSecret) return;

      // Dropping on a client folder
      if (overIdStr.startsWith("client-")) {
        const targetClientId = overIdStr.replace("client-", "");
        if (currentSecret.client_id !== targetClientId) {
          try {
            await moveSecretToClient(secretId, targetClientId);
            const targetClient = clients.find((c) => c.id === targetClientId);
            toast.success(
              `Secret déplacé vers ${targetClient?.name || "le client"}`,
            );
          } catch (error: any) {
            toast.error(error.message || "Erreur lors du déplacement");
          }
        }
        return;
      }

      // Dropping on a custom folder
      let targetFolderId: string | null = null;

      if (overIdStr.startsWith("folder-")) {
        targetFolderId = overIdStr.replace("folder-", "");
      } else if (overIdStr.startsWith("secret-")) {
        // Dropped on another secret - find its folder
        const targetSecretId = overIdStr.replace("secret-", "");
        const targetSecret = secrets.find((s) => s.id === targetSecretId);
        targetFolderId = targetSecret?.folder_id || null;
      }

      if (currentSecret.folder_id !== targetFolderId) {
        try {
          await moveSecretToFolder(secretId, targetFolderId);
          toast.success(
            targetFolderId
              ? "Secret déplacé dans le dossier"
              : "Secret retiré du dossier",
          );
        } catch (error: any) {
          toast.error(error.message || "Erreur lors du déplacement");
        }
      }
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      await deleteFolder(folderToDelete.id);
      toast.success("Dossier supprimé");
      setFolderToDelete(undefined);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    }
  };

  const handleDeleteSecret = async () => {
    if (!secretToDelete) return;
    try {
      await deleteSecret(secretToDelete.id, secretToDelete.client_id);
      toast.success("Secret supprimé");
      if (selectedSecret?.id === secretToDelete.id) {
        setSelectedSecret(null);
      }
      setSecretToDelete(undefined);
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  // Build sortable items list - include ALL secrets for drag & drop
  const sortableItems = useMemo(() => {
    const items: string[] = [];

    // Custom folders and their secrets
    orderedFolders.forEach((folder) => {
      items.push(`folder-${folder.id}`);
      if (expandedFolders.has(folder.id)) {
        const folderSecrets = secretsByFolder.get(folder.id) || [];
        folderSecrets.forEach((s) => items.push(`secret-${s.id}`));
      }
    });

    // Client folder secrets
    clientsWithSecrets.forEach((client) => {
      if (expandedClients.has(client.id)) {
        const clientSecrets = secretsByClient.get(client.id) || [];
        clientSecrets.forEach((s) => items.push(`secret-${s.id}`));
      }
    });

    // Loose secrets
    looseSecrets.forEach((s) => items.push(`secret-${s.id}`));

    return items;
  }, [
    orderedFolders,
    expandedFolders,
    secretsByFolder,
    clientsWithSecrets,
    expandedClients,
    secretsByClient,
    looseSecrets,
  ]);

  // Get active item for overlay
  const activeFolder =
    activeType === "folder" && activeId
      ? folders.find((f) => `folder-${f.id}` === activeId)
      : null;
  const activeSecret =
    activeType === "secret" && activeId
      ? secrets.find((s) => `secret-${s.id}` === activeId)
      : null;

  const hasContent =
    folders.length > 0 ||
    clientsWithSecrets.length > 0 ||
    looseSecrets.length > 0;

  return (
    <div className="flex gap-6">
      {/* Main list */}
      <div
        className={cn(
          "flex-1 space-y-4 transition-all",
          selectedSecret && "max-w-[calc(100%-420px)]",
        )}
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher des secrets..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {canWrite && (
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  setFolderToEdit(undefined);
                  setCreateFolderOpen(true);
                }}
                variant="outline"
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Nouveau dossier
              </Button>
              <Button
                onClick={() => {
                  setSecretToEdit(undefined);
                  setCreateSecretOpen(true);
                }}
                size="sm"
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Nouveau secret
              </Button>
            </div>
          )}
        </div>

        {!hasContent ? (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg border-dashed text-center">
            <div className="rounded-full bg-secondary p-4 mb-4">
              <Key className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">Aucun secret</h3>
            <p className="text-muted-foreground text-sm max-w-sm mt-2">
              Commencez par créer un secret pour stocker vos identifiants en
              toute sécurité.
            </p>
            {canWrite && (
              <Button
                className="mt-4"
                onClick={() => setCreateSecretOpen(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Créer un secret
              </Button>
            )}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={sortableItems}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {/* Custom folders */}
                {orderedFolders.length > 0 && (
                  <>
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-2">
                      <FolderClosed className="h-3 w-3" />
                      Dossiers
                    </div>
                    {orderedFolders.map((folder) => (
                      <SortableFolder
                        key={folder.id}
                        folder={folder}
                        secrets={secretsByFolder.get(folder.id) || []}
                        isExpanded={expandedFolders.has(folder.id)}
                        onToggle={() => toggleFolder(folder.id)}
                        onEdit={() => {
                          setFolderToEdit(folder);
                          setCreateFolderOpen(true);
                        }}
                        onDelete={() => setFolderToDelete(folder)}
                        onSecretClick={setSelectedSecret}
                        selectedSecretId={selectedSecret?.id || null}
                        canWrite={canWrite}
                        canDeleteFolder={canDeleteFolder}
                        isDraggingOver={
                          overId === `folder-${folder.id}` &&
                          activeType === "secret"
                        }
                      />
                    ))}
                  </>
                )}

                {/* Client auto-folders */}
                {clientsWithSecrets.length > 0 && (
                  <>
                    {orderedFolders.length > 0 && (
                      <div className="border-t my-4" />
                    )}
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-2">
                      <Building2 className="h-3 w-3" />
                      Clients
                    </div>
                    {clientsWithSecrets.map((client) => (
                      <ClientFolder
                        key={client.id}
                        client={client}
                        secrets={secretsByClient.get(client.id) || []}
                        isExpanded={expandedClients.has(client.id)}
                        onToggle={() => toggleClient(client.id)}
                        onSecretClick={setSelectedSecret}
                        selectedSecretId={selectedSecret?.id || null}
                        canWrite={canWrite}
                        isDraggingOver={
                          overId === `client-${client.id}` &&
                          activeType === "secret"
                        }
                      />
                    ))}
                  </>
                )}

                {/* Loose secrets (no folder, no client) - flat list */}
                {filteredLooseSecrets.length > 0 && (
                  <>
                    {(orderedFolders.length > 0 ||
                      clientsWithSecrets.length > 0) && (
                      <div className="border-t my-4" />
                    )}
                    <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-2">
                      <Key className="h-3 w-3" />
                      Secrets
                    </div>
                    {filteredLooseSecrets.map((secret) => (
                      <LooseSecret
                        key={secret.id}
                        secret={secret}
                        isSelected={selectedSecret?.id === secret.id}
                        onClick={() => setSelectedSecret(secret)}
                        canDrag={canWrite}
                      />
                    ))}
                  </>
                )}
              </div>
            </SortableContext>

            {/* Drag overlay */}
            <DragOverlay>
              {activeFolder ? (
                <div className="bg-card border rounded-lg p-3 shadow-lg opacity-90 flex items-center gap-2">
                  <FolderClosed
                    className="h-5 w-5"
                    style={{ color: activeFolder.color || undefined }}
                  />
                  <span className="font-medium">{activeFolder.name}</span>
                </div>
              ) : activeSecret ? (
                <div className="bg-card border rounded-lg p-2 shadow-lg opacity-90 flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {activeSecret.title}
                  </span>
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Detail panel */}
      {selectedSecret && (
        <div className="w-[400px] shrink-0 rounded-lg border bg-card overflow-hidden sticky top-0 max-h-[calc(100vh-12rem)]">
          <SecretDetailPanel
            secret={selectedSecret}
            onClose={() => setSelectedSecret(null)}
            onEdit={() => {
              setSecretToEdit(selectedSecret);
              setCreateSecretOpen(true);
            }}
            onDelete={() => setSecretToDelete(selectedSecret)}
            canWrite={canWrite}
            canDelete={canDeleteFolder}
          />
        </div>
      )}

      {/* Dialogs */}
      <CreateFolderDialog
        open={createFolderOpen}
        onOpenChange={setCreateFolderOpen}
        organizationId={organizationId}
        folderToEdit={folderToEdit}
      />

      <CreateSecretDialog
        open={createSecretOpen}
        onOpenChange={setCreateSecretOpen}
        secretToEdit={secretToEdit}
      />

      <AlertDialog
        open={!!folderToDelete}
        onOpenChange={(open) => !open && setFolderToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le dossier "{folderToDelete?.name}" sera supprimé. Les secrets
              qu'il contient ne seront plus associés à un dossier.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteFolder}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!secretToDelete}
        onOpenChange={(open) => !open && setSecretToDelete(undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le secret ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action supprimera définitivement le secret "
              {secretToDelete?.title}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSecret}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
