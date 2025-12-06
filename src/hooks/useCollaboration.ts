import { useContext } from "react";
import { CollaborationContext } from "@/context/CollaborationContext";
import type { CollaborationContextType } from "@/types/collaboration";

/**
 * Custom hook to access the collaboration context.
 * Must be used within a CollaborationProvider.
 */
export function useCollaboration(): CollaborationContextType {
  const context = useContext(CollaborationContext);

  if (!context) {
    throw new Error(
      "useCollaboration must be used within a CollaborationProvider. " +
        "Make sure to wrap your component tree with <CollaborationProvider>."
    );
  }

  return context;
}
