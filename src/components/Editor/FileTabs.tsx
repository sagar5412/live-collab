import { X, FileCode, FileJson, FileText, File } from "lucide-react";

interface FileTab {
  id: string;
  name: string;
  language: string;
  isActive: boolean;
  hasUnsavedChanges?: boolean;
}

interface FileTabsProps {
  files: FileTab[];
  onTabClick: (fileId: string) => void;
  onTabClose: (fileId: string) => void;
  className?: string;
}

// Get icon based on file extension/language
function getFileIcon(language: string) {
  const iconProps = { size: 14, strokeWidth: 2 };

  switch (language) {
    case "javascript":
    case "typescript":
    case "javascriptreact":
    case "typescriptreact":
      return <FileCode {...iconProps} className="file-icon--code" />;
    case "json":
      return <FileJson {...iconProps} className="file-icon--json" />;
    case "markdown":
    case "plaintext":
      return <FileText {...iconProps} className="file-icon--text" />;
    default:
      return <File {...iconProps} />;
  }
}

// Get language from file extension
export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() || "";

  const languageMap: Record<string, string> = {
    js: "javascript",
    jsx: "javascriptreact",
    ts: "typescript",
    tsx: "typescriptreact",
    json: "json",
    md: "markdown",
    css: "css",
    scss: "scss",
    html: "html",
    py: "python",
    go: "go",
    rs: "rust",
    rb: "ruby",
    java: "java",
    c: "c",
    cpp: "cpp",
    cs: "csharp",
    php: "php",
    swift: "swift",
    kt: "kotlin",
    sql: "sql",
    yaml: "yaml",
    yml: "yaml",
    xml: "xml",
    sh: "shell",
    bash: "shell",
  };

  return languageMap[ext] || "plaintext";
}

export function FileTabs({
  files,
  onTabClick,
  onTabClose,
  className = "",
}: FileTabsProps) {
  if (files.length === 0) {
    return (
      <div className={`file-tabs file-tabs--empty ${className}`}>
        <span className="file-tabs__empty-text">No files open</span>
        <style>{fileTabsStyles}</style>
      </div>
    );
  }

  return (
    <div className={`file-tabs ${className}`}>
      <div className="file-tabs__container">
        {files.map((file) => (
          <div
            key={file.id}
            className={`file-tab ${file.isActive ? "file-tab--active" : ""}`}
            onClick={() => onTabClick(file.id)}
          >
            <span className="file-tab__icon">{getFileIcon(file.language)}</span>
            <span className="file-tab__name">{file.name}</span>
            {file.hasUnsavedChanges && (
              <span className="file-tab__unsaved" title="Unsaved changes">
                •
              </span>
            )}
            <button
              className="file-tab__close"
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(file.id);
              }}
              title="Close"
            >
              <X size={12} />
            </button>
          </div>
        ))}
      </div>
      <style>{fileTabsStyles}</style>
    </div>
  );
}

const fileTabsStyles = `
  .file-tabs {
    display: flex;
    background: #1e1e1e;
    border-bottom: 1px solid #333;
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .file-tabs--empty {
    padding: 8px 16px;
  }

  .file-tabs__empty-text {
    color: #666;
    font-size: 12px;
  }

  .file-tabs__container {
    display: flex;
    min-width: max-content;
  }

  .file-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: #252526;
    border-right: 1px solid #333;
    cursor: pointer;
    transition: background 0.15s ease;
    user-select: none;
    min-width: 100px;
    max-width: 180px;
  }

  .file-tab:hover {
    background: #2d2d2d;
  }

  .file-tab--active {
    background: #1e1e1e;
    border-top: 2px solid #007acc;
    padding-top: 6px;
  }

  .file-tab__icon {
    display: flex;
    align-items: center;
    color: #888;
  }

  .file-tab--active .file-tab__icon {
    color: #007acc;
  }

  .file-icon--code { color: #f7df1e; }
  .file-icon--json { color: #f5a623; }
  .file-icon--text { color: #89cff0; }

  .file-tab__name {
    flex: 1;
    font-size: 12px;
    color: #ccc;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .file-tab--active .file-tab__name {
    color: #fff;
  }

  .file-tab__unsaved {
    color: #fff;
    font-size: 18px;
    line-height: 1;
  }

  .file-tab__close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border: none;
    background: transparent;
    color: #888;
    cursor: pointer;
    border-radius: 3px;
    opacity: 0;
    transition: all 0.15s ease;
  }

  .file-tab:hover .file-tab__close {
    opacity: 1;
  }

  .file-tab__close:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }
`;

export default FileTabs;
