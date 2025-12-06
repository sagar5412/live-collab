import React, {
  createContext,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Awareness } from "y-protocols/awareness";
import type {
  CollaborationContextType,
  CollaborationUser,
  RoomState,
  CursorPosition,
  SelectionRange,
  ConnectionStatus,
} from "@/types/collaboration";

// Generate random color for user
function generateUserColor(): string {
  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#96CEB4",
    "#FFEAA7",
    "#DDA0DD",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E9",
    "#F8B500",
    "#00CED1",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
}

// Generate user ID
function generateUserId(): string {
  return `user-${Math.random().toString(36).substring(2, 9)}`;
}

// Default room state
const defaultRoomState: RoomState = {
  roomId: null,
  users: [],
  isConnected: false,
  connectionStatus: "disconnected",
};

// Create context
export const CollaborationContext =
  createContext<CollaborationContextType | null>(null);

interface CollaborationProviderProps {
  children: React.ReactNode;
  serverUrl?: string;
}

export function CollaborationProvider({
  children,
  serverUrl = import.meta.env.VITE_WS_URL || "ws://localhost:1234",
}: CollaborationProviderProps) {
  // Yjs document and provider refs
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebsocketProvider | null>(null);
  const awarenessRef = useRef<Awareness | null>(null);

  // State
  const [roomState, setRoomState] = useState<RoomState>(defaultRoomState);
  const [currentUser, setCurrentUser] = useState<CollaborationUser | null>(
    null
  );
  const [codeContent, setCodeContent] = useState<Y.Text | null>(null);
  const [filesMap, setFilesMap] = useState<Y.Map<unknown> | null>(null);

  // Update connection status
  const updateConnectionStatus = useCallback(
    (status: ConnectionStatus, error?: string) => {
      setRoomState((prev) => ({
        ...prev,
        connectionStatus: status,
        isConnected: status === "connected",
        error,
      }));
    },
    []
  );

  // Update users from awareness
  const updateUsersFromAwareness = useCallback(() => {
    const awareness = awarenessRef.current;
    if (!awareness) return;

    const users: CollaborationUser[] = [];
    awareness.getStates().forEach((state, clientId) => {
      if (state.user) {
        users.push({
          id: state.user.id || `client-${clientId}`,
          name: state.user.name || "Anonymous",
          color: state.user.color || "#888888",
          cursor: state.cursor,
          selection: state.selection,
        });
      }
    });

    setRoomState((prev) => ({ ...prev, users }));
  }, []);

  // Join a room
  const joinRoom = useCallback(
    async (roomId: string, userName: string) => {
      // Clean up existing connection
      if (providerRef.current) {
        providerRef.current.destroy();
      }
      if (ydocRef.current) {
        ydocRef.current.destroy();
      }

      updateConnectionStatus("connecting");

      try {
        // Create new Y.Doc
        const ydoc = new Y.Doc();
        ydocRef.current = ydoc;

        // Get shared types
        const yText = ydoc.getText("code");
        const yFiles = ydoc.getMap("files");
        setCodeContent(yText);
        setFilesMap(yFiles);

        // Create WebSocket provider
        const provider = new WebsocketProvider(serverUrl, roomId, ydoc);
        providerRef.current = provider;
        awarenessRef.current = provider.awareness;

        // Create current user
        const user: CollaborationUser = {
          id: generateUserId(),
          name: userName,
          color: generateUserColor(),
        };
        setCurrentUser(user);

        // Set awareness state
        provider.awareness.setLocalStateField("user", user);

        // Listen for connection events
        provider.on("status", (event: { status: string }) => {
          if (event.status === "connected") {
            updateConnectionStatus("connected");
            setRoomState((prev) => ({ ...prev, roomId }));
          } else if (event.status === "disconnected") {
            updateConnectionStatus("disconnected");
          }
        });

        // Listen for awareness updates
        provider.awareness.on("change", updateUsersFromAwareness);

        // Initial users update
        updateUsersFromAwareness();
      } catch (error) {
        console.error("Failed to join room:", error);
        updateConnectionStatus(
          "error",
          error instanceof Error ? error.message : "Unknown error"
        );
      }
    },
    [serverUrl, updateConnectionStatus, updateUsersFromAwareness]
  );

  // Leave the current room
  const leaveRoom = useCallback(() => {
    if (providerRef.current) {
      providerRef.current.destroy();
      providerRef.current = null;
    }
    if (ydocRef.current) {
      ydocRef.current.destroy();
      ydocRef.current = null;
    }
    awarenessRef.current = null;

    setCodeContent(null);
    setFilesMap(null);
    setCurrentUser(null);
    setRoomState(defaultRoomState);
  }, []);

  // Update cursor position
  const updateCursor = useCallback((position: CursorPosition) => {
    const awareness = awarenessRef.current;
    if (awareness) {
      awareness.setLocalStateField("cursor", position);
    }
  }, []);

  // Update selection range
  const updateSelection = useCallback((selection: SelectionRange | null) => {
    const awareness = awarenessRef.current;
    if (awareness) {
      awareness.setLocalStateField("selection", selection);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      leaveRoom();
    };
  }, [leaveRoom]);

  const contextValue: CollaborationContextType = {
    roomState,
    currentUser,
    ydoc: ydocRef.current,
    awareness: awarenessRef.current,
    codeContent,
    filesMap,
    joinRoom,
    leaveRoom,
    updateCursor,
    updateSelection,
  };

  return (
    <CollaborationContext.Provider value={contextValue}>
      {children}
    </CollaborationContext.Provider>
  );
}
