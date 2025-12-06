import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import { WebSocketServer, WebSocket } from "ws";
import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import * as encoding from "lib0/encoding";
import * as decoding from "lib0/decoding";

import {
  User,
  Room,
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
} from "./types";
import { executeCode, getSupportedLanguages } from "./docker-runner";

// Configuration
const HTTP_PORT = process.env.PORT ? parseInt(process.env.PORT) : 3001;
const WS_PORT = process.env.WS_PORT ? parseInt(process.env.WS_PORT) : 1234;

// Message types for Yjs protocol
const messageSync = 0;
const messageAwareness = 1;

// In-memory storage
const rooms = new Map<string, Room>();
const docs = new Map<string, Y.Doc>();
const awareness = new Map<string, awarenessProtocol.Awareness>();

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

// Get or create Y.Doc for a room
function getOrCreateDoc(roomId: string): {
  doc: Y.Doc;
  awareness: awarenessProtocol.Awareness;
} {
  if (!docs.has(roomId)) {
    const doc = new Y.Doc();
    const awarenesss = new awarenessProtocol.Awareness(doc);
    docs.set(roomId, doc);
    awareness.set(roomId, awarenesss);
    console.log(`📄 Created new Y.Doc for room: ${roomId}`);
  }
  return {
    doc: docs.get(roomId)!,
    awareness: awareness.get(roomId)!,
  };
}

// Get or create room
function getOrCreateRoom(roomId: string): Room {
  if (!rooms.has(roomId)) {
    const room: Room = {
      id: roomId,
      users: new Map(),
      createdAt: new Date(),
    };
    rooms.set(roomId, room);
    console.log(`🏠 Created new room: ${roomId}`);
  }
  return rooms.get(roomId)!;
}

// ============================================
// Express HTTP Server
// ============================================
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    uptime: process.uptime(),
    rooms: rooms.size,
    docs: docs.size,
  });
});

// Get room info
app.get("/api/rooms/:roomId", (req, res) => {
  const room = rooms.get(req.params.roomId);
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }
  res.json({
    id: room.id,
    users: Array.from(room.users.values()),
    createdAt: room.createdAt,
  });
});

// Get supported languages
app.get("/api/languages", (_req, res) => {
  res.json({ languages: getSupportedLanguages() });
});

// Create HTTP server
const httpServer = createServer(app);

// ============================================
// Socket.IO Server
// ============================================
const io = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  // Initialize socket data
  socket.data.userId = socket.id;
  socket.data.currentRoom = null;

  // Join room
  socket.on("join-room", ({ roomId, user }) => {
    const room = getOrCreateRoom(roomId);

    // Create user object
    const newUser: User = {
      id: socket.id,
      name: user.name,
      color: user.color || generateUserColor(),
    };

    // Store user in room and socket data
    room.users.set(socket.id, newUser);
    socket.data.userName = newUser.name;
    socket.data.userColor = newUser.color;
    socket.data.currentRoom = roomId;

    // Join Socket.IO room
    socket.join(roomId);

    // Notify others in room
    socket.to(roomId).emit("user-joined", {
      user: newUser,
      users: Array.from(room.users.values()),
    });

    // Send room info to joiner
    socket.emit("room-info", {
      roomId,
      users: Array.from(room.users.values()),
    });

    console.log(`👤 User ${newUser.name} joined room ${roomId}`);
  });

  // Leave room
  socket.on("leave-room", ({ roomId }) => {
    handleLeaveRoom(socket, roomId);
  });

  // Cursor update
  socket.on("cursor-update", ({ roomId, cursor }) => {
    const room = rooms.get(roomId);
    if (room) {
      const user = room.users.get(socket.id);
      if (user) {
        user.cursor = cursor;
        socket.to(roomId).emit("cursor-moved", {
          userId: socket.id,
          cursor,
        });
      }
    }
  });

  // Code execution
  socket.on("execute-code", async (request, callback) => {
    console.log(
      `⚙️ Executing ${request.language} code in room ${request.roomId}`
    );

    try {
      const result = await executeCode(request);
      callback(result);

      // Also broadcast to room
      socket.to(request.roomId).emit("execution-result", result);
    } catch (error) {
      const errorResult = {
        success: false,
        stdout: "",
        stderr: error instanceof Error ? error.message : "Unknown error",
        exitCode: null,
        executionTime: 0,
        error: "SERVER_ERROR",
      };
      callback(errorResult);
    }
  });

  // Disconnect
  socket.on("disconnect", () => {
    if (socket.data.currentRoom) {
      handleLeaveRoom(socket, socket.data.currentRoom);
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

function handleLeaveRoom(socket: any, roomId: string) {
  const room = rooms.get(roomId);
  if (room) {
    room.users.delete(socket.id);
    socket.leave(roomId);

    // Notify others
    socket.to(roomId).emit("user-left", {
      userId: socket.id,
      users: Array.from(room.users.values()),
    });

    // Clean up empty rooms
    if (room.users.size === 0) {
      rooms.delete(roomId);
      console.log(`🏠 Room ${roomId} is now empty`);
    }

    socket.data.currentRoom = null;
    console.log(`👤 User left room ${roomId}`);
  }
}

// ============================================
// Yjs WebSocket Server
// ============================================
const wss = new WebSocketServer({ port: WS_PORT });

// Track connections per room
const roomConnections = new Map<string, Set<WebSocket>>();

wss.on("connection", (ws, req) => {
  // Extract room ID from URL path
  const url = new URL(req.url || "", `ws://localhost:${WS_PORT}`);
  const roomId = url.pathname.slice(1) || "default";

  console.log(`📡 Yjs WebSocket connected to room: ${roomId}`);

  // Get or create the Y.Doc and awareness for this room
  const { doc, awareness: roomAwareness } = getOrCreateDoc(roomId);

  // Track this connection
  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Set());
  }
  roomConnections.get(roomId)!.add(ws);

  // Send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  ws.send(encoding.toUint8Array(encoder));

  // Send awareness state
  const awarenessEncoder = encoding.createEncoder();
  encoding.writeVarUint(awarenessEncoder, messageAwareness);
  encoding.writeVarUint8Array(
    awarenessEncoder,
    awarenessProtocol.encodeAwarenessUpdate(
      roomAwareness,
      Array.from(roomAwareness.getStates().keys())
    )
  );
  ws.send(encoding.toUint8Array(awarenessEncoder));

  // Handle incoming messages
  ws.on("message", (data: Buffer) => {
    try {
      const decoder = decoding.createDecoder(new Uint8Array(data));
      const messageType = decoding.readVarUint(decoder);

      switch (messageType) {
        case messageSync: {
          const encoder = encoding.createEncoder();
          encoding.writeVarUint(encoder, messageSync);
          const syncMessageType = syncProtocol.readSyncMessage(
            decoder,
            encoder,
            doc,
            null
          );

          if (syncMessageType === 0) {
            // Sync step 2 - send response
            if (encoding.length(encoder) > 1) {
              ws.send(encoding.toUint8Array(encoder));
            }
          }

          // Broadcast updates to other clients
          if (syncMessageType === 1 || syncMessageType === 2) {
            const update = encoding.toUint8Array(encoder);
            if (update.length > 1) {
              broadcastToRoom(roomId, update, ws);
            }
          }
          break;
        }
        case messageAwareness: {
          const update = decoding.readVarUint8Array(decoder);
          awarenessProtocol.applyAwarenessUpdate(roomAwareness, update, null);

          // Broadcast awareness to others
          const awarenessEncoder = encoding.createEncoder();
          encoding.writeVarUint(awarenessEncoder, messageAwareness);
          encoding.writeVarUint8Array(awarenessEncoder, update);
          broadcastToRoom(roomId, encoding.toUint8Array(awarenessEncoder), ws);
          break;
        }
      }
    } catch (error) {
      console.error("Error processing Yjs message:", error);
    }
  });

  // Handle doc updates
  const updateHandler = (update: Uint8Array, origin: any) => {
    if (origin !== ws) {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageSync);
      syncProtocol.writeUpdate(encoder, update);
      ws.send(encoding.toUint8Array(encoder));
    }
  };
  doc.on("update", updateHandler);

  // Handle awareness updates
  const awarenessHandler = ({
    added,
    updated,
    removed,
  }: {
    added: number[];
    updated: number[];
    removed: number[];
  }) => {
    const changedClients = added.concat(updated, removed);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, messageAwareness);
    encoding.writeVarUint8Array(
      encoder,
      awarenessProtocol.encodeAwarenessUpdate(roomAwareness, changedClients)
    );
    ws.send(encoding.toUint8Array(encoder));
  };
  roomAwareness.on("update", awarenessHandler);

  // Handle close
  ws.on("close", () => {
    doc.off("update", updateHandler);
    roomAwareness.off("update", awarenessHandler);
    roomConnections.get(roomId)?.delete(ws);

    if (roomConnections.get(roomId)?.size === 0) {
      roomConnections.delete(roomId);
    }

    console.log(`📡 Yjs WebSocket disconnected from room: ${roomId}`);
  });
});

function broadcastToRoom(
  roomId: string,
  data: Uint8Array,
  exclude?: WebSocket
) {
  const connections = roomConnections.get(roomId);
  if (connections) {
    connections.forEach((conn) => {
      if (conn !== exclude && conn.readyState === WebSocket.OPEN) {
        conn.send(data);
      }
    });
  }
}

wss.on("error", (error) => {
  console.error("❌ Yjs WebSocket Server error:", error);
});

// ============================================
// Start Servers
// ============================================
httpServer.listen(HTTP_PORT, () => {
  console.log(`
╔════════════════════════════════════════════════╗
║           CollabPlay Server Started            ║
╠════════════════════════════════════════════════╣
║  🚀 HTTP/Socket.IO: http://localhost:${HTTP_PORT}     ║
║  📡 Yjs WebSocket:  ws://localhost:${WS_PORT}        ║
╚════════════════════════════════════════════════╝
  `);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down servers...");
  httpServer.close();
  wss.close();
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n🛑 Shutting down servers...");
  httpServer.close();
  wss.close();
  process.exit(0);
});
