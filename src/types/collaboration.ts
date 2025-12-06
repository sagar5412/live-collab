import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

// User cursor position in editor
export interface CursorPosition {
  lineNumber: number;
  column: number;
}

// User selection range in editor
export interface SelectionRange {
  startLineNumber: number;
  startColumn: number;
  endLineNumber: number;
  endColumn: number;
}

// Collaboration user
export interface CollaborationUser {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
}

// Connection status
export type ConnectionStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "error";

// Room state
export interface RoomState {
  roomId: string | null;
  users: CollaborationUser[];
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  error?: string;
}

// File in the collaborative workspace
export interface CollaborativeFile {
  id: string;
  name: string;
  language: string;
  content: Y.Text;
}

// Collaboration context value
export interface CollaborationContextType {
  // State
  roomState: RoomState;
  currentUser: CollaborationUser | null;
  ydoc: Y.Doc | null;
  awareness: Awareness | null;

  // Shared types
  codeContent: Y.Text | null;
  filesMap: Y.Map<unknown> | null;

  // Actions
  joinRoom: (roomId: string, userName: string) => Promise<void>;
  leaveRoom: () => void;
  updateCursor: (position: CursorPosition) => void;
  updateSelection: (selection: SelectionRange | null) => void;
}

// Awareness state for each user
export interface AwarenessState {
  user: CollaborationUser;
  cursor?: CursorPosition;
  selection?: SelectionRange;
}

// WebSocket provider options
export interface ProviderOptions {
  roomId: string;
  serverUrl: string;
}

// Monaco decoration for remote cursor
export interface RemoteCursorDecoration {
  userId: string;
  userName: string;
  color: string;
  position: CursorPosition;
  decorationId?: string;
}

// Yjs-Monaco binding options
export interface YjsMonacoBindingOptions {
  yText: Y.Text;
  awareness: Awareness;
  currentUserId: string;
}
