import { useRef, useCallback, useState } from "react";
import Editor, { type OnMount, type OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useEditorBinding } from "@/hooks/useEditorBinding";
import { FileTabs } from "./FileTabs";
import { UserCursors } from "./UserCursors";

interface MonacoEditorProps {
  className?: string;
  defaultLanguage?: string;
  theme?: "vs-dark" | "light" | "hc-black";
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
}

// Default editor options optimized for collaboration
const defaultEditorOptions: Monaco.editor.IStandaloneEditorConstructionOptions =
  {
    fontSize: 14,
    fontFamily: "'JetBrains Mono', 'Fira Code', Consolas, monospace",
    lineHeight: 22,
    minimap: { enabled: true, scale: 0.8 },
    scrollBeyondLastLine: false,
    automaticLayout: true,
    tabSize: 2,
    wordWrap: "on",
    lineNumbers: "on",
    renderLineHighlight: "all",
    cursorBlinking: "smooth",
    cursorSmoothCaretAnimation: "on",
    smoothScrolling: true,
    padding: { top: 16, bottom: 16 },
    folding: true,
    foldingHighlight: true,
    showFoldingControls: "mouseover",
    bracketPairColorization: { enabled: true },
    guides: {
      bracketPairs: true,
      indentation: true,
    },
    occurrencesHighlight: "singleFile",
    selectionHighlight: true,
    renderWhitespace: "selection",
  };

interface FileState {
  id: string;
  name: string;
  language: string;
  isActive: boolean;
  hasUnsavedChanges: boolean;
}

export function MonacoEditor({
  className = "",
  defaultLanguage = "typescript",
  theme = "vs-dark",
  readOnly = false,
  onContentChange,
}: MonacoEditorProps) {
  const { roomState, codeContent, awareness, currentUser } = useCollaboration();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState(defaultLanguage);

  const [files, setFiles] = useState<FileState[]>([
    {
      id: "1",
      name: "index.ts",
      language: "typescript",
      isActive: true,
      hasUnsavedChanges: false,
    },
  ]);

  useEditorBinding({
    editor: editorRef.current,
    yText: codeContent,
    awareness: awareness,
    currentUserId: currentUser?.id || null,
  });

  const handleEditorMount: OnMount = useCallback(
    (editor, _monaco) => {
      editorRef.current = editor;
      editor.focus();
      editor.updateOptions({ readOnly });
    },
    [readOnly]
  );

  const handleContentChange: OnChange = useCallback(
    (value) => {
      if (onContentChange && value !== undefined) {
        onContentChange(value);
      }
      setFiles((prev) =>
        prev.map((f) => (f.isActive ? { ...f, hasUnsavedChanges: true } : f))
      );
    },
    [onContentChange]
  );

  const handleTabClick = useCallback(
    (fileId: string) => {
      setFiles((prev) =>
        prev.map((f) => ({
          ...f,
          isActive: f.id === fileId,
        }))
      );
      const file = files.find((f) => f.id === fileId);
      if (file) {
        setCurrentLanguage(file.language);
      }
    },
    [files]
  );

  const handleTabClose = useCallback((fileId: string) => {
    setFiles((prev) => {
      const filtered = prev.filter((f) => f.id !== fileId);
      if (prev.find((f) => f.id === fileId)?.isActive && filtered.length > 0) {
        filtered[0].isActive = true;
        setCurrentLanguage(filtered[0].language);
      }
      return filtered;
    });
  }, []);

  return (
    <div className={`monaco-editor-container ${className}`}>
      <div className="monaco-editor__header">
        <FileTabs
          files={files}
          onTabClick={handleTabClick}
          onTabClose={handleTabClose}
        />
        <div className="monaco-editor__users">
          <UserCursors />
        </div>
      </div>

      {!roomState.isConnected && (
        <div className="monaco-editor__status">
          <span className="monaco-editor__status-dot" />
          {roomState.connectionStatus === "connecting"
            ? "Connecting..."
            : "Disconnected"}
        </div>
      )}

      <div className="monaco-editor__editor">
        <Editor
          height="100%"
          language={currentLanguage}
          theme={theme}
          options={defaultEditorOptions}
          onMount={handleEditorMount}
          onChange={handleContentChange}
          loading={
            <div className="monaco-editor__loading">
              <span>Loading editor...</span>
            </div>
          }
        />
      </div>

      <style>{`
        .monaco-editor-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: #1e1e1e;
          border-radius: 8px;
          overflow: hidden;
        }

        .monaco-editor__header {
          display: flex;
          justify-content: space-between;
          align-items: stretch;
          background: #252526;
          border-bottom: 1px solid #333;
        }

        .monaco-editor__users {
          display: flex;
          align-items: center;
          padding-right: 8px;
          background: #252526;
        }

        .monaco-editor__status {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 12px;
          background: linear-gradient(135deg, #ff6b6b22, #ff6b6b11);
          color: #ff6b6b;
          font-size: 12px;
          border-bottom: 1px solid #ff6b6b33;
        }

        .monaco-editor__status-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ff6b6b;
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .monaco-editor__editor {
          flex: 1;
          min-height: 0;
        }

        .monaco-editor__loading {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #888;
          font-size: 14px;
        }
      `}</style>
    </div>
  );
}

export default MonacoEditor;
