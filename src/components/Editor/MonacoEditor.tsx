import { useRef, useCallback, useEffect } from "react";
import Editor, { type OnMount, type OnChange } from "@monaco-editor/react";
import type * as Monaco from "monaco-editor";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useEditorBinding } from "@/hooks/useEditorBinding";
import { FileTabs } from "./FileTabs";
import { UserCursors } from "./UserCursors";

interface FileState {
  id: string;
  name: string;
  language: string;
  isActive: boolean;
  hasUnsavedChanges: boolean;
}

interface MonacoEditorProps {
  className?: string;
  defaultLanguage?: string;
  defaultValue?: string;
  theme?: "vs-dark" | "light" | "hc-black";
  readOnly?: boolean;
  onContentChange?: (content: string) => void;
  // File management props
  files?: FileState[];
  onTabClick?: (fileId: string) => void;
  onTabClose?: (fileId: string) => void;
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
    guides: { bracketPairs: true, indentation: true },
    occurrencesHighlight: "singleFile",
    selectionHighlight: true,
    renderWhitespace: "selection",
  };

export function MonacoEditor({
  className = "",
  defaultLanguage = "typescript",
  defaultValue = "",
  theme = "vs-dark",
  readOnly = false,
  onContentChange,
  files,
  onTabClick,
  onTabClose,
}: MonacoEditorProps) {
  const { roomState, codeContent, awareness, currentUser } = useCollaboration();
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);

  // Get active file language
  const activeFile = files?.find((f) => f.isActive);
  const currentLanguage = activeFile?.language || defaultLanguage;

  // If no files provided, use default internal file
  const displayFiles = files || [
    {
      id: "default",
      name: "index.ts",
      language: "typescript",
      isActive: true,
      hasUnsavedChanges: false,
    },
  ];

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
    },
    [onContentChange]
  );

  // Update editor language when active file changes
  useEffect(() => {
    if (editorRef.current && currentLanguage) {
      const model = editorRef.current.getModel();
      if (model) {
        // Monaco doesn't have setLanguage on model directly, need to use editor
        // Language is set via the Editor component's language prop
      }
    }
  }, [currentLanguage]);

  return (
    <div className={`monaco-editor-container ${className}`}>
      <div className="monaco-editor__header">
        <FileTabs
          files={displayFiles}
          onTabClick={onTabClick || (() => {})}
          onTabClose={onTabClose || (() => {})}
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
          defaultValue={defaultValue}
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
        .monaco-editor-container { display: flex; flex-direction: column; height: 100%; background: #1e1e1e; border-radius: 8px; overflow: hidden; }
        .monaco-editor__header { display: flex; justify-content: space-between; align-items: stretch; background: #252526; border-bottom: 1px solid #333; }
        .monaco-editor__users { display: flex; align-items: center; padding-right: 8px; background: #252526; }
        .monaco-editor__status { display: flex; align-items: center; gap: 8px; padding: 6px 12px; background: linear-gradient(135deg, #ff6b6b22, #ff6b6b11); color: #ff6b6b; font-size: 12px; border-bottom: 1px solid #ff6b6b33; }
        .monaco-editor__status-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff6b6b; animation: pulse 1.5s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
        .monaco-editor__editor { flex: 1; min-height: 0; }
        .monaco-editor__loading { display: flex; align-items: center; justify-content: center; height: 100%; color: #888; font-size: 14px; }
      `}</style>
    </div>
  );
}

export default MonacoEditor;
