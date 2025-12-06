// User type for presence tracking
export interface User {
  id: string;
  name: string;
  color: string;
  cursor?: CursorPosition;
}

// Cursor position in the editor
export interface CursorPosition {
  lineNumber: number;
  column: number;
}

// Room representation
export interface Room {
  id: string;
  users: Map<string, User>;
  createdAt: Date;
}

// Code execution request
export interface ExecutionRequest {
  code: string;
  language: "javascript" | "typescript" | "python" | "go" | "rust";
  roomId: string;
  timeout?: number; // ms, default 10000
}

// Code execution result
export interface ExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  executionTime: number; // ms
  error?: string;
}

// Socket.io client-to-server events
export interface ClientToServerEvents {
  "join-room": (data: { roomId: string; user: Omit<User, "id"> }) => void;
  "leave-room": (data: { roomId: string }) => void;
  "cursor-update": (data: { roomId: string; cursor: CursorPosition }) => void;
  "execute-code": (
    data: ExecutionRequest,
    callback: (result: ExecutionResult) => void
  ) => void;
}

// Socket.io server-to-client events
export interface ServerToClientEvents {
  "user-joined": (data: { user: User; users: User[] }) => void;
  "user-left": (data: { userId: string; users: User[] }) => void;
  "cursor-moved": (data: { userId: string; cursor: CursorPosition }) => void;
  "execution-result": (data: ExecutionResult) => void;
  "room-info": (data: { roomId: string; users: User[] }) => void;
  error: (data: { message: string }) => void;
}

// Socket.io inter-server events (for scaling)
export interface InterServerEvents {
  ping: () => void;
}

// Socket.io socket data
export interface SocketData {
  userId: string;
  userName: string;
  userColor: string;
  currentRoom: string | null;
}

// Docker execution config
export interface DockerConfig {
  image: string;
  command: string[];
  timeout: number;
  memoryLimit: string;
  cpuLimit: string;
}

// Language-specific Docker configurations
export const LANGUAGE_CONFIGS: Record<
  ExecutionRequest["language"],
  DockerConfig
> = {
  javascript: {
    image: "node:20-alpine",
    command: ["node", "-e"],
    timeout: 10000,
    memoryLimit: "128m",
    cpuLimit: "0.5",
  },
  typescript: {
    image: "node:20-alpine",
    command: ["npx", "tsx", "-e"],
    timeout: 15000,
    memoryLimit: "256m",
    cpuLimit: "0.5",
  },
  python: {
    image: "python:3.11-alpine",
    command: ["python", "-c"],
    timeout: 10000,
    memoryLimit: "128m",
    cpuLimit: "0.5",
  },
  go: {
    image: "golang:1.21-alpine",
    command: ["go", "run", "/tmp/main.go"],
    timeout: 15000,
    memoryLimit: "256m",
    cpuLimit: "0.5",
  },
  rust: {
    image: "rust:1.75-alpine",
    command: [
      "rustc",
      "--edition=2021",
      "-o",
      "/tmp/out",
      "/tmp/main.rs",
      "&&",
      "/tmp/out",
    ],
    timeout: 30000,
    memoryLimit: "512m",
    cpuLimit: "1",
  },
};
