# 🎮 CollabPlay

> A real-time collaborative code playground built with React, Monaco Editor, and Yjs

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)

## ✨ Features

- **Real-time Collaboration** - Multiple users can edit code simultaneously using Yjs CRDT
- **Monaco Editor** - The same editor that powers VS Code
- **WebSocket Sync** - Low-latency real-time synchronization
- **Syntax Highlighting** - Full language support from Monaco
- **Room-based Sessions** - Create or join collaboration rooms

## 🛠️ Tech Stack

### Frontend

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **Monaco Editor** - Code editor (`@monaco-editor/react`)
- **Yjs** - CRDT for real-time collaboration
  - `y-websocket` - WebSocket provider for Yjs
  - `y-monaco` - Monaco Editor binding for Yjs
- **Tailwind CSS** - Utility-first CSS
- **Lucide React** - Icons

### Backend (WebSocket Server)

- **Socket.IO** - Real-time bidirectional communication
- **ws** - WebSocket implementation
- **y-websocket** - Yjs WebSocket server

## 📁 Project Structure

```
live-collab/
├── src/
│   ├── components/     # React components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Utility functions
│   ├── context/        # React context providers
│   ├── services/       # API and WebSocket services
│   ├── types/          # TypeScript type definitions
│   ├── App.tsx         # Main App component
│   └── main.tsx        # Entry point
├── public/             # Static assets
├── .env                # Environment variables
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
├── tsconfig.json       # TypeScript configuration
└── package.json        # Dependencies and scripts
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd live-collab
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy `.env` and update values if needed:

   ```env
   VITE_WS_URL=ws://localhost:1234
   VITE_API_URL=http://localhost:3001
   VITE_APP_NAME=CollabPlay
   VITE_DEFAULT_ROOM=default-room
   ```

4. **Start the WebSocket server** (in a separate terminal)

   ```bash
   npx y-websocket
   ```

   The Yjs WebSocket server will start on port 1234.

5. **Start the development server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📜 Available Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |
| `npm run lint`    | Run ESLint               |

## 🔧 Configuration

### Path Aliases

The project uses TypeScript path aliases for cleaner imports:

```typescript
import { Button } from "@/components/Button";
import { useEditor } from "@/hooks/useEditor";
import { formatCode } from "@/utils/formatter";
import { EditorContext } from "@/context/EditorContext";
import { api } from "@/services/api";
import type { User } from "@/types/user";
```

### Proxy Configuration

Development server proxies are configured in `vite.config.ts`:

- `/api/*` → `http://localhost:3001` (Backend API)
- `/ws/*` → `ws://localhost:1234` (WebSocket server)

## 🌐 Environment Variables

| Variable            | Description                | Default                 |
| ------------------- | -------------------------- | ----------------------- |
| `VITE_WS_URL`       | WebSocket server URL       | `ws://localhost:1234`   |
| `VITE_API_URL`      | Backend API URL            | `http://localhost:3001` |
| `VITE_APP_NAME`     | Application name           | `CollabPlay`            |
| `VITE_DEFAULT_ROOM` | Default collaboration room | `default-room`          |

## 📝 License

MIT

---

Built with ❤️ using React, Monaco, and Yjs
