import * as Y from "yjs";
import { getLanguageFromFilename } from "@/components/Editor/FileTabs";

// File/folder node in the tree
export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  parentId: string | null;
  children?: string[]; // IDs of child nodes (for folders)
  createdAt: number;
  updatedAt: number;
}

// Generate unique ID
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a new file in the Yjs shared file tree
 */
export function createFile(
  filesMap: Y.Map<unknown>,
  name: string,
  parentId: string | null = null
): string {
  const id = generateId();
  const language = getLanguageFromFilename(name);

  const fileNode: FileNode = {
    id,
    name,
    type: "file",
    language,
    parentId,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  filesMap.doc?.transact(() => {
    // Add file to map
    filesMap.set(id, fileNode);

    // Update parent folder's children
    if (parentId) {
      const parent = filesMap.get(parentId) as FileNode | undefined;
      if (parent && parent.type === "folder") {
        const updatedParent: FileNode = {
          ...parent,
          children: [...(parent.children || []), id],
          updatedAt: Date.now(),
        };
        filesMap.set(parentId, updatedParent);
      }
    }
  });

  return id;
}

/**
 * Create a new folder in the Yjs shared file tree
 */
export function createFolder(
  filesMap: Y.Map<unknown>,
  name: string,
  parentId: string | null = null
): string {
  const id = generateId();

  const folderNode: FileNode = {
    id,
    name,
    type: "folder",
    parentId,
    children: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  filesMap.doc?.transact(() => {
    filesMap.set(id, folderNode);

    if (parentId) {
      const parent = filesMap.get(parentId) as FileNode | undefined;
      if (parent && parent.type === "folder") {
        const updatedParent: FileNode = {
          ...parent,
          children: [...(parent.children || []), id],
          updatedAt: Date.now(),
        };
        filesMap.set(parentId, updatedParent);
      }
    }
  });

  return id;
}

/**
 * Rename a file or folder
 */
export function renameFile(
  filesMap: Y.Map<unknown>,
  fileId: string,
  newName: string
): boolean {
  const node = filesMap.get(fileId) as FileNode | undefined;
  if (!node) return false;

  const updatedNode: FileNode = {
    ...node,
    name: newName,
    language:
      node.type === "file" ? getLanguageFromFilename(newName) : undefined,
    updatedAt: Date.now(),
  };

  filesMap.set(fileId, updatedNode);
  return true;
}

/**
 * Delete a file or folder (and all its children)
 */
export function deleteFile(filesMap: Y.Map<unknown>, fileId: string): boolean {
  const node = filesMap.get(fileId) as FileNode | undefined;
  if (!node) return false;

  filesMap.doc?.transact(() => {
    // Recursively delete children if folder
    if (node.type === "folder" && node.children) {
      for (const childId of node.children) {
        deleteFile(filesMap, childId);
      }
    }

    // Remove from parent's children
    if (node.parentId) {
      const parent = filesMap.get(node.parentId) as FileNode | undefined;
      if (parent && parent.type === "folder") {
        const updatedParent: FileNode = {
          ...parent,
          children: (parent.children || []).filter((id) => id !== fileId),
          updatedAt: Date.now(),
        };
        filesMap.set(node.parentId, updatedParent);
      }
    }

    // Delete the node
    filesMap.delete(fileId);
  });

  return true;
}

/**
 * Move a file or folder to a new parent
 */
export function moveFile(
  filesMap: Y.Map<unknown>,
  fileId: string,
  newParentId: string | null
): boolean {
  const node = filesMap.get(fileId) as FileNode | undefined;
  if (!node) return false;

  // Prevent moving into itself or its children
  if (newParentId === fileId) return false;
  if (newParentId && isDescendant(filesMap, newParentId, fileId)) return false;

  filesMap.doc?.transact(() => {
    // Remove from old parent
    if (node.parentId) {
      const oldParent = filesMap.get(node.parentId) as FileNode | undefined;
      if (oldParent && oldParent.type === "folder") {
        const updatedOldParent: FileNode = {
          ...oldParent,
          children: (oldParent.children || []).filter((id) => id !== fileId),
          updatedAt: Date.now(),
        };
        filesMap.set(node.parentId, updatedOldParent);
      }
    }

    // Add to new parent
    if (newParentId) {
      const newParent = filesMap.get(newParentId) as FileNode | undefined;
      if (newParent && newParent.type === "folder") {
        const updatedNewParent: FileNode = {
          ...newParent,
          children: [...(newParent.children || []), fileId],
          updatedAt: Date.now(),
        };
        filesMap.set(newParentId, updatedNewParent);
      }
    }

    // Update node's parentId
    const updatedNode: FileNode = {
      ...node,
      parentId: newParentId,
      updatedAt: Date.now(),
    };
    filesMap.set(fileId, updatedNode);
  });

  return true;
}

/**
 * Check if targetId is a descendant of ancestorId
 */
function isDescendant(
  filesMap: Y.Map<unknown>,
  targetId: string,
  ancestorId: string
): boolean {
  const target = filesMap.get(targetId) as FileNode | undefined;
  if (!target) return false;
  if (target.parentId === ancestorId) return true;
  if (target.parentId)
    return isDescendant(filesMap, target.parentId, ancestorId);
  return false;
}

/**
 * Get all root-level files/folders
 */
export function getRootNodes(filesMap: Y.Map<unknown>): FileNode[] {
  const nodes: FileNode[] = [];
  filesMap.forEach((value) => {
    const node = value as FileNode;
    if (node.parentId === null) {
      nodes.push(node);
    }
  });
  return nodes.sort((a, b) => {
    // Folders first, then alphabetically
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * Get children of a folder sorted
 */
export function getChildren(
  filesMap: Y.Map<unknown>,
  parentId: string
): FileNode[] {
  const parent = filesMap.get(parentId) as FileNode | undefined;
  if (!parent || parent.type !== "folder" || !parent.children) return [];

  const children: FileNode[] = [];
  for (const childId of parent.children) {
    const child = filesMap.get(childId) as FileNode | undefined;
    if (child) children.push(child);
  }

  return children.sort((a, b) => {
    if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}
