import { useState, useEffect, useCallback } from "react";
import { useCollaboration } from "./useCollaboration";
import {
  type FileNode,
  createFile,
  createFolder,
  deleteFile,
  renameFile,
  getRootNodes,
  getChildren,
} from "@/utils/file-operations";

interface UseFileTreeReturn {
  rootNodes: FileNode[];
  selectedFileId: string | null;
  expandedFolders: Set<string>;
  selectFile: (fileId: string) => void;
  toggleFolder: (folderId: string) => void;
  handleCreateFile: (name: string, parentId?: string | null) => string | null;
  handleCreateFolder: (name: string, parentId?: string | null) => string | null;
  handleRename: (fileId: string, newName: string) => boolean;
  handleDelete: (fileId: string) => boolean;
  getNodeChildren: (parentId: string) => FileNode[];
  isLoading: boolean;
}

/**
 * Hook to manage file tree state and operations
 */
export function useFileTree(): UseFileTreeReturn {
  const { filesMap, roomState } = useCollaboration();
  const [rootNodes, setRootNodes] = useState<FileNode[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(true);

  // Update file tree when filesMap changes
  useEffect(() => {
    if (!filesMap) {
      setRootNodes([]);
      setIsLoading(false);
      return;
    }

    const updateTree = () => {
      const nodes = getRootNodes(filesMap);
      setRootNodes(nodes);
      setIsLoading(false);
    };

    // Initial load
    updateTree();

    // Listen for changes
    filesMap.observe(updateTree);

    return () => {
      filesMap.unobserve(updateTree);
    };
  }, [filesMap]);

  // Select a file
  const selectFile = useCallback((fileId: string) => {
    setSelectedFileId(fileId);
  }, []);

  // Toggle folder expansion
  const toggleFolder = useCallback((folderId: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  // Create a new file
  const handleCreateFile = useCallback(
    (name: string, parentId: string | null = null): string | null => {
      if (!filesMap) return null;
      const id = createFile(filesMap, name, parentId);
      setSelectedFileId(id);
      return id;
    },
    [filesMap]
  );

  // Create a new folder
  const handleCreateFolder = useCallback(
    (name: string, parentId: string | null = null): string | null => {
      if (!filesMap) return null;
      const id = createFolder(filesMap, name, parentId);
      setExpandedFolders((prev) => new Set([...prev, id]));
      return id;
    },
    [filesMap]
  );

  // Rename a file or folder
  const handleRename = useCallback(
    (fileId: string, newName: string): boolean => {
      if (!filesMap) return false;
      return renameFile(filesMap, fileId, newName);
    },
    [filesMap]
  );

  // Delete a file or folder
  const handleDelete = useCallback(
    (fileId: string): boolean => {
      if (!filesMap) return false;
      const success = deleteFile(filesMap, fileId);
      if (success && selectedFileId === fileId) {
        setSelectedFileId(null);
      }
      return success;
    },
    [filesMap, selectedFileId]
  );

  // Get children of a folder
  const getNodeChildren = useCallback(
    (parentId: string): FileNode[] => {
      if (!filesMap) return [];
      return getChildren(filesMap, parentId);
    },
    [filesMap]
  );

  return {
    rootNodes,
    selectedFileId,
    expandedFolders,
    selectFile,
    toggleFolder,
    handleCreateFile,
    handleCreateFolder,
    handleRename,
    handleDelete,
    getNodeChildren,
    isLoading: isLoading || !roomState.isConnected,
  };
}
