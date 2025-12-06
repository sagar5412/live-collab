import { useEffect, useState, useCallback } from "react";
import { useCollaboration } from "./useCollaboration";
import type {
  CollaborationUser,
  CursorPosition,
  SelectionRange,
} from "@/types/collaboration";

interface UseUserPresenceReturn {
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  updateCursorPosition: (position: CursorPosition) => void;
  updateSelectionRange: (selection: SelectionRange | null) => void;
  getOtherUsers: () => CollaborationUser[];
}

/**
 * Custom hook for tracking user presence in a collaborative room.
 * Provides current user info and list of other users with their cursor positions.
 */
export function useUserPresence(): UseUserPresenceReturn {
  const { roomState, currentUser, awareness, updateCursor, updateSelection } =
    useCollaboration();
  const [users, setUsers] = useState<CollaborationUser[]>([]);

  // Update users list when awareness changes
  useEffect(() => {
    if (!awareness) {
      setUsers([]);
      return;
    }

    const handleAwarenessChange = () => {
      const newUsers: CollaborationUser[] = [];

      awareness.getStates().forEach((state, _clientId) => {
        if (state.user) {
          newUsers.push({
            id: state.user.id,
            name: state.user.name,
            color: state.user.color,
            cursor: state.cursor,
            selection: state.selection,
          });
        }
      });

      setUsers(newUsers);
    };

    // Initial update
    handleAwarenessChange();

    // Subscribe to awareness changes
    awareness.on("change", handleAwarenessChange);

    return () => {
      awareness.off("change", handleAwarenessChange);
    };
  }, [awareness]);

  // Update cursor position
  const updateCursorPosition = useCallback(
    (position: CursorPosition) => {
      updateCursor(position);
    },
    [updateCursor]
  );

  // Update selection range
  const updateSelectionRange = useCallback(
    (selection: SelectionRange | null) => {
      updateSelection(selection);
    },
    [updateSelection]
  );

  // Get users excluding current user
  const getOtherUsers = useCallback(() => {
    if (!currentUser) return users;
    return users.filter((user) => user.id !== currentUser.id);
  }, [users, currentUser]);

  return {
    users: roomState.users,
    currentUser,
    updateCursorPosition,
    updateSelectionRange,
    getOtherUsers,
  };
}
