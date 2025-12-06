import { useEffect, useRef, useCallback } from "react";
import * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type * as Monaco from "monaco-editor";
import { bindYjsToMonaco } from "@/utils/yjs-monaco";

interface UseEditorBindingOptions {
  editor: Monaco.editor.IStandaloneCodeEditor | null;
  yText: Y.Text | null;
  awareness: Awareness | null;
  currentUserId: string | null;
}

interface UseEditorBindingReturn {
  isBinding: boolean;
}

/**
 * Hook to manage Monaco-Yjs binding lifecycle.
 * Automatically binds when editor and yText are available,
 * and cleans up on unmount or when dependencies change.
 */
export function useEditorBinding({
  editor,
  yText,
  awareness,
  currentUserId,
}: UseEditorBindingOptions): UseEditorBindingReturn {
  const destroyBindingRef = useRef<(() => void) | null>(null);
  const isBindingRef = useRef(false);

  // Create binding when all dependencies are ready
  const createBinding = useCallback(() => {
    // Clean up existing binding
    if (destroyBindingRef.current) {
      destroyBindingRef.current();
      destroyBindingRef.current = null;
    }

    // Check if we have all required dependencies
    if (!editor || !yText || !awareness || !currentUserId) {
      isBindingRef.current = false;
      return;
    }

    try {
      const destroy = bindYjsToMonaco(editor, yText, awareness, currentUserId);
      destroyBindingRef.current = destroy.destroy;
      isBindingRef.current = true;
    } catch (error) {
      console.error("Failed to create Yjs-Monaco binding:", error);
      isBindingRef.current = false;
    }
  }, [editor, yText, awareness, currentUserId]);

  // Effect to manage binding lifecycle
  useEffect(() => {
    createBinding();

    return () => {
      if (destroyBindingRef.current) {
        destroyBindingRef.current();
        destroyBindingRef.current = null;
      }
      isBindingRef.current = false;
    };
  }, [createBinding]);

  return {
    isBinding: isBindingRef.current,
  };
}
