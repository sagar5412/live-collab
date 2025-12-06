import type * as Monaco from "monaco-editor";
import * as Y from "yjs";
import { Awareness } from "y-protocols/awareness";
import type {
  CollaborationUser,
  CursorPosition,
  SelectionRange,
} from "@/types/collaboration";

// Remote cursor decoration class names
const CURSOR_CLASS_PREFIX = "yjs-cursor-";
const SELECTION_CLASS_PREFIX = "yjs-selection-";

interface YjsMonacoBinding {
  destroy: () => void;
}

// Remote cursor state (internal use)

/**
 * Create CSS styles for remote cursors and selections
 */
function createCursorStyles(
  users: Map<string, CollaborationUser>
): HTMLStyleElement {
  const style = document.createElement("style");
  style.id = "yjs-cursor-styles";

  let css = "";
  users.forEach((user) => {
    const cursorClass = `${CURSOR_CLASS_PREFIX}${user.id.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}`;
    const selectionClass = `${SELECTION_CLASS_PREFIX}${user.id.replace(
      /[^a-zA-Z0-9]/g,
      "-"
    )}`;

    css += `
      .${cursorClass} {
        background-color: ${user.color};
        width: 2px !important;
        margin-left: -1px;
      }
      .${cursorClass}::after {
        content: '${user.name}';
        position: absolute;
        top: -18px;
        left: 0;
        background-color: ${user.color};
        color: white;
        padding: 2px 6px;
        border-radius: 3px;
        font-size: 11px;
        white-space: nowrap;
        pointer-events: none;
      }
      .${selectionClass} {
        background-color: ${user.color}33;
      }
    `;
  });

  style.textContent = css;
  return style;
}

/**
 * Bind Yjs Y.Text to Monaco Editor for real-time collaboration
 */
export function bindYjsToMonaco(
  editor: Monaco.editor.IStandaloneCodeEditor,
  yText: Y.Text,
  awareness: Awareness,
  currentUserId: string
): YjsMonacoBinding {
  const model = editor.getModel();
  if (!model) {
    throw new Error("Monaco editor model is not available");
  }

  let isLocalChange = false;
  let isRemoteChange = false;
  const decorations: Map<string, string[]> = new Map();
  let styleElement: HTMLStyleElement | null = null;

  // Sync initial content from Yjs to Monaco
  const initialContent = yText.toString();
  if (model.getValue() !== initialContent) {
    isRemoteChange = true;
    model.setValue(initialContent);
    isRemoteChange = false;
  }

  // Handle local changes in Monaco -> sync to Yjs
  const modelContentDisposable = model.onDidChangeContent((event) => {
    if (isRemoteChange) return;

    isLocalChange = true;
    yText.doc?.transact(() => {
      // Process changes in reverse order to maintain correct positions
      const sortedChanges = [...event.changes].sort(
        (a, b) => b.rangeOffset - a.rangeOffset
      );

      for (const change of sortedChanges) {
        // Delete old text
        if (change.rangeLength > 0) {
          yText.delete(change.rangeOffset, change.rangeLength);
        }
        // Insert new text
        if (change.text) {
          yText.insert(change.rangeOffset, change.text);
        }
      }
    });
    isLocalChange = false;
  });

  // Handle remote changes in Yjs -> sync to Monaco
  const yTextObserver = (event: Y.YTextEvent) => {
    if (isLocalChange) return;

    isRemoteChange = true;

    let index = 0;
    const operations: Monaco.editor.IIdentifiedSingleEditOperation[] = [];

    for (const delta of event.delta) {
      if (delta.retain !== undefined) {
        index += delta.retain;
      } else if (delta.insert !== undefined) {
        const pos = model.getPositionAt(index);
        const text = typeof delta.insert === "string" ? delta.insert : "";
        operations.push({
          range: {
            startLineNumber: pos.lineNumber,
            startColumn: pos.column,
            endLineNumber: pos.lineNumber,
            endColumn: pos.column,
          },
          text,
          forceMoveMarkers: true,
        });
        index += text.length;
      } else if (delta.delete !== undefined) {
        const startPos = model.getPositionAt(index);
        const endPos = model.getPositionAt(index + delta.delete);
        operations.push({
          range: {
            startLineNumber: startPos.lineNumber,
            startColumn: startPos.column,
            endLineNumber: endPos.lineNumber,
            endColumn: endPos.column,
          },
          text: "",
          forceMoveMarkers: true,
        });
      }
    }

    if (operations.length > 0) {
      model.applyEdits(operations);
    }

    isRemoteChange = false;
  };

  yText.observe(yTextObserver);

  // Track cursor position changes
  const cursorDisposable = editor.onDidChangeCursorPosition((event) => {
    const position: CursorPosition = {
      lineNumber: event.position.lineNumber,
      column: event.position.column,
    };
    awareness.setLocalStateField("cursor", position);
  });

  // Track selection changes
  const selectionDisposable = editor.onDidChangeCursorSelection((event) => {
    const sel = event.selection;

    // Check if there's an actual selection (not just cursor)
    if (
      sel.startLineNumber === sel.endLineNumber &&
      sel.startColumn === sel.endColumn
    ) {
      awareness.setLocalStateField("selection", null);
    } else {
      const selection: SelectionRange = {
        startLineNumber: sel.startLineNumber,
        startColumn: sel.startColumn,
        endLineNumber: sel.endLineNumber,
        endColumn: sel.endColumn,
      };
      awareness.setLocalStateField("selection", selection);
    }
  });

  // Render remote cursors and selections
  const updateRemoteCursors = () => {
    const users = new Map<string, CollaborationUser>();
    const newDecorations: Monaco.editor.IModelDeltaDecoration[] = [];

    awareness.getStates().forEach((state, _clientId) => {
      const userId = state.user?.id;
      if (!userId || userId === currentUserId) return;

      const user: CollaborationUser = state.user;
      users.set(userId, user);

      const cursorClass = `${CURSOR_CLASS_PREFIX}${userId.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}`;
      const selectionClass = `${SELECTION_CLASS_PREFIX}${userId.replace(
        /[^a-zA-Z0-9]/g,
        "-"
      )}`;

      // Add cursor decoration
      if (state.cursor) {
        newDecorations.push({
          range: {
            startLineNumber: state.cursor.lineNumber,
            startColumn: state.cursor.column,
            endLineNumber: state.cursor.lineNumber,
            endColumn: state.cursor.column + 1,
          },
          options: {
            className: cursorClass,
            stickiness: 1,
          },
        });
      }

      // Add selection decoration
      if (state.selection) {
        newDecorations.push({
          range: {
            startLineNumber: state.selection.startLineNumber,
            startColumn: state.selection.startColumn,
            endLineNumber: state.selection.endLineNumber,
            endColumn: state.selection.endColumn,
          },
          options: {
            className: selectionClass,
            stickiness: 1,
          },
        });
      }
    });

    // Update styles
    if (styleElement) {
      styleElement.remove();
    }
    styleElement = createCursorStyles(users);
    document.head.appendChild(styleElement);

    // Apply decorations
    const oldDecorations = Array.from(decorations.values()).flat();
    const newIds = editor.deltaDecorations(oldDecorations, newDecorations);

    // Store new decoration IDs
    decorations.clear();
    decorations.set("all", newIds);
  };

  // Listen for awareness changes
  awareness.on("change", updateRemoteCursors);

  // Initial render
  updateRemoteCursors();

  // Return cleanup function
  return {
    destroy: () => {
      modelContentDisposable.dispose();
      cursorDisposable.dispose();
      selectionDisposable.dispose();
      yText.unobserve(yTextObserver);
      awareness.off("change", updateRemoteCursors);

      // Clean up decorations
      const oldDecorations = Array.from(decorations.values()).flat();
      editor.deltaDecorations(oldDecorations, []);

      // Remove styles
      if (styleElement) {
        styleElement.remove();
      }
    },
  };
}

/**
 * Hook-friendly wrapper for Yjs-Monaco binding
 */
export function createYjsMonacoBinding(
  editor: Monaco.editor.IStandaloneCodeEditor,
  yText: Y.Text,
  awareness: Awareness,
  currentUserId: string
): () => void {
  const binding = bindYjsToMonaco(editor, yText, awareness, currentUserId);
  return binding.destroy;
}
