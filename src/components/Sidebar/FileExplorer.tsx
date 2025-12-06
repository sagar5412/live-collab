import { useState, useCallback } from "react";
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  FolderOpen,
  Plus,
  Trash2,
  Edit3,
  FileCode,
  FileJson,
  FileText,
} from "lucide-react";
import { useFileTree } from "@/hooks/useFileTree";
import type { FileNode } from "@/utils/file-operations";

interface FileExplorerProps {
  className?: string;
  onFileSelect?: (fileId: string, fileName: string) => void;
}

// Get icon for file based on language
function getFileIcon(node: FileNode) {
  if (node.type === "folder") return null;

  const iconProps = { size: 16, strokeWidth: 1.5 };
  switch (node.language) {
    case "javascript":
    case "typescript":
    case "javascriptreact":
    case "typescriptreact":
      return <FileCode {...iconProps} className="text-yellow-400" />;
    case "json":
      return <FileJson {...iconProps} className="text-orange-400" />;
    case "markdown":
      return <FileText {...iconProps} className="text-blue-300" />;
    default:
      return <File {...iconProps} className="text-gray-400" />;
  }
}

export function FileExplorer({
  className = "",
  onFileSelect,
}: FileExplorerProps) {
  const {
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
    isLoading,
  } = useFileTree();

  const [isCreating, setIsCreating] = useState<"file" | "folder" | null>(null);
  const [createName, setCreateName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [_contextMenuId, setContextMenuId] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);

  // Handle file selection
  const handleFileClick = useCallback(
    (node: FileNode) => {
      if (node.type === "folder") {
        toggleFolder(node.id);
        setSelectedFolderId(node.id); // Select folder for creating files inside
      } else {
        selectFile(node.id);
        setSelectedFolderId(node.parentId); // Track parent folder
        onFileSelect?.(node.id, node.name);
      }
    },
    [toggleFolder, selectFile, onFileSelect]
  );

  // Handle create submit
  const handleCreateSubmit = useCallback(() => {
    if (!createName.trim()) {
      setIsCreating(null);
      setCreateName("");
      return;
    }

    if (isCreating === "file") {
      handleCreateFile(createName, selectedFolderId); // Pass selected folder as parent
    } else if (isCreating === "folder") {
      handleCreateFolder(createName, selectedFolderId); // Pass selected folder as parent
    }

    setIsCreating(null);
    setCreateName("");
  }, [
    createName,
    isCreating,
    handleCreateFile,
    handleCreateFolder,
    selectedFolderId,
  ]);

  // Handle rename submit
  const handleRenameSubmit = useCallback(() => {
    if (editingId && editName.trim()) {
      handleRename(editingId, editName);
    }
    setEditingId(null);
    setEditName("");
  }, [editingId, editName, handleRename]);

  // Render a file/folder node
  const renderNode = (node: FileNode, depth: number = 0) => {
    const isExpanded = expandedFolders.has(node.id);
    const isSelected = selectedFileId === node.id;
    const isEditing = editingId === node.id;
    const children = node.type === "folder" ? getNodeChildren(node.id) : [];

    return (
      <div key={node.id}>
        <div
          className={`file-node ${isSelected ? "file-node--selected" : ""}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => handleFileClick(node)}
          onContextMenu={(e) => {
            e.preventDefault();
            setContextMenuId(node.id);
          }}
        >
          {/* Expand/collapse icon for folders */}
          {node.type === "folder" && (
            <span className="file-node__chevron">
              {isExpanded ? (
                <ChevronDown size={14} />
              ) : (
                <ChevronRight size={14} />
              )}
            </span>
          )}

          {/* File/folder icon */}
          <span className="file-node__icon">
            {node.type === "folder" ? (
              isExpanded ? (
                <FolderOpen size={16} className="text-blue-400" />
              ) : (
                <Folder size={16} className="text-blue-400" />
              )
            ) : (
              getFileIcon(node)
            )}
          </span>

          {/* Name or edit input */}
          {isEditing ? (
            <input
              type="text"
              className="file-node__input"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleRenameSubmit();
                if (e.key === "Escape") {
                  setEditingId(null);
                  setEditName("");
                }
              }}
              autoFocus
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <span className="file-node__name">{node.name}</span>
          )}

          {/* Actions */}
          <div className="file-node__actions">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setEditingId(node.id);
                setEditName(node.name);
              }}
              title="Rename"
            >
              <Edit3 size={12} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(node.id);
              }}
              title="Delete"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Render children if folder is expanded */}
        {node.type === "folder" && isExpanded && (
          <div className="file-node__children">
            {children.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`file-explorer ${className}`}>
      {/* Header */}
      <div className="file-explorer__header">
        <span className="file-explorer__title">Files</span>
        <div className="file-explorer__header-actions">
          <button
            onClick={() => {
              setIsCreating("file");
              setCreateName("untitled.ts");
            }}
            title="New File"
          >
            <Plus size={14} />
            <File size={12} />
          </button>
          <button
            onClick={() => {
              setIsCreating("folder");
              setCreateName("new-folder");
            }}
            title="New Folder"
          >
            <Plus size={14} />
            <Folder size={12} />
          </button>
        </div>
      </div>

      {/* Create new item input */}
      {isCreating && (
        <div className="file-explorer__create">
          <span className="file-explorer__create-icon">
            {isCreating === "folder" ? (
              <Folder size={16} />
            ) : (
              <File size={16} />
            )}
          </span>
          <input
            type="text"
            className="file-explorer__create-input"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            onBlur={handleCreateSubmit}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateSubmit();
              if (e.key === "Escape") {
                setIsCreating(null);
                setCreateName("");
              }
            }}
            placeholder={`New ${isCreating}...`}
            autoFocus
          />
        </div>
      )}

      {/* File tree */}
      <div className="file-explorer__tree">
        {isLoading ? (
          <div className="file-explorer__loading">Loading files...</div>
        ) : rootNodes.length === 0 ? (
          <div className="file-explorer__empty">
            <p>No files yet</p>
            <p className="file-explorer__empty-hint">
              Click + to create a file
            </p>
          </div>
        ) : (
          rootNodes.map((node) => renderNode(node))
        )}
      </div>

      <style>{fileExplorerStyles}</style>
    </div>
  );
}

const fileExplorerStyles = `
  .file-explorer {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #1e1e1e;
    color: #ccc;
    font-size: 13px;
  }

  .file-explorer__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 12px 8px;
    border-bottom: 1px solid #333;
  }

  .file-explorer__title {
    font-weight: 600;
    text-transform: uppercase;
    font-size: 11px;
    letter-spacing: 0.5px;
    color: #888;
  }

  .file-explorer__header-actions {
    display: flex;
    gap: 4px;
  }

  .file-explorer__header-actions button {
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 4px 6px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    border-radius: 4px;
  }

  .file-explorer__header-actions button:hover {
    background: #333;
    color: #fff;
  }

  .file-explorer__create {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    background: #252526;
    border-bottom: 1px solid #333;
  }

  .file-explorer__create-icon {
    color: #888;
  }

  .file-explorer__create-input {
    flex: 1;
    background: #1e1e1e;
    border: 1px solid #007acc;
    color: #fff;
    padding: 4px 8px;
    font-size: 12px;
    border-radius: 3px;
    outline: none;
  }

  .file-explorer__tree {
    flex: 1;
    overflow-y: auto;
    padding: 8px 0;
  }

  .file-explorer__loading,
  .file-explorer__empty {
    padding: 24px;
    text-align: center;
    color: #666;
  }

  .file-explorer__empty-hint {
    font-size: 11px;
    margin-top: 8px;
    color: #555;
  }

  .file-node {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    cursor: pointer;
    user-select: none;
  }

  .file-node:hover {
    background: #2a2a2a;
  }

  .file-node--selected {
    background: #094771 !important;
  }

  .file-node__chevron {
    display: flex;
    color: #888;
    width: 14px;
  }

  .file-node__icon {
    display: flex;
    margin-right: 4px;
  }

  .file-node__name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-node__input {
    flex: 1;
    background: #1e1e1e;
    border: 1px solid #007acc;
    color: #fff;
    padding: 2px 6px;
    font-size: 12px;
    border-radius: 2px;
    outline: none;
  }

  .file-node__actions {
    display: none;
    gap: 4px;
  }

  .file-node:hover .file-node__actions {
    display: flex;
  }

  .file-node__actions button {
    padding: 2px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    border-radius: 3px;
  }

  .file-node__actions button:hover {
    background: #444;
    color: #fff;
  }

  .file-node__children {
    /* Children indentation is handled by paddingLeft */
  }

  .text-yellow-400 { color: #f7df1e; }
  .text-orange-400 { color: #f5a623; }
  .text-blue-300 { color: #89cff0; }
  .text-blue-400 { color: #3b82f6; }
  .text-gray-400 { color: #9ca3af; }
`;

export default FileExplorer;
