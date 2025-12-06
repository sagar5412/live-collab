import { useState, useEffect, useCallback } from "react";
import { Code2, FolderTree, Settings, Play, Eye } from "lucide-react";
import { useCollaboration } from "@/hooks/useCollaboration";
import { ResizablePanels } from "@/components/Layout/ResizablePanels";
import { MonacoEditor } from "@/components/Editor/MonacoEditor";
import { FileExplorer } from "@/components/Sidebar/FileExplorer";
import { ProjectSettings } from "@/components/Sidebar/ProjectSettings";
import { CodeExecutor } from "@/components/Preview/CodeExecutor";
import { PreviewPanel } from "@/components/Preview/PreviewPanel";
import { ConnectionStatus } from "@/components/Common/ConnectionStatus";

type SidebarTab = "files" | "settings";
type PreviewTab = "output" | "preview";

function App() {
  const { joinRoom, roomState } = useCollaboration();
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>("files");
  const [previewTab, setPreviewTab] = useState<PreviewTab>("output");
  const [currentCode, setCurrentCode] = useState(
    '// Start coding...\nconsole.log("Hello, CollabPlay!");'
  );
  const [isJoining, setIsJoining] = useState(false);

  // Get room ID from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const roomIdFromUrl = urlParams.get("room");

  // Join room on mount if room ID in URL
  useEffect(() => {
    if (roomIdFromUrl && !roomState.isConnected && !isJoining) {
      const storedName = localStorage.getItem("collabplay-username");
      if (storedName) {
        handleJoinRoom(roomIdFromUrl, storedName);
      }
    }
  }, [roomIdFromUrl, roomState.isConnected, isJoining]);

  // Handle room join
  const handleJoinRoom = useCallback(
    async (roomId: string, name: string) => {
      setIsJoining(true);
      try {
        await joinRoom(roomId, name);
        localStorage.setItem("collabplay-username", name);
        // Update URL
        const url = new URL(window.location.href);
        url.searchParams.set("room", roomId);
        window.history.pushState({}, "", url.toString());
      } catch (error) {
        console.error("Failed to join room:", error);
      } finally {
        setIsJoining(false);
      }
    },
    [joinRoom]
  );

  // Handle code change from editor
  const handleCodeChange = useCallback((code: string) => {
    setCurrentCode(code);
  }, []);

  // If not connected, show join screen
  if (!roomState.isConnected && !isJoining) {
    return (
      <JoinScreen defaultRoomId={roomIdFromUrl || ""} onJoin={handleJoinRoom} />
    );
  }

  // Loading state
  if (isJoining) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__spinner" />
        <p>Joining room...</p>
        <style>{`
          .loading-screen { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; background: #1e1e1e; color: #ccc; gap: 16px; }
          .loading-screen__spinner { width: 40px; height: 40px; border: 3px solid #333; border-top-color: #007acc; border-radius: 50%; animation: spin 1s linear infinite; }
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app__header">
        <div className="app__logo">
          <Code2 size={24} />
          <span>CollabPlay</span>
        </div>
        <div className="app__room-info">
          <span>Room: {roomState.roomId?.slice(0, 8)}...</span>
        </div>
      </header>

      {/* Main content */}
      <main className="app__main">
        <ResizablePanels
          storageKey="main-layout"
          panels={[
            // Sidebar
            {
              id: "sidebar",
              minSize: 15,
              defaultSize: 20,
              content: (
                <div className="sidebar">
                  <div className="sidebar__tabs">
                    <button
                      className={sidebarTab === "files" ? "active" : ""}
                      onClick={() => setSidebarTab("files")}
                      title="Files"
                    >
                      <FolderTree size={18} />
                    </button>
                    <button
                      className={sidebarTab === "settings" ? "active" : ""}
                      onClick={() => setSidebarTab("settings")}
                      title="Settings"
                    >
                      <Settings size={18} />
                    </button>
                  </div>
                  <div className="sidebar__content">
                    {sidebarTab === "files" && <FileExplorer />}
                    {sidebarTab === "settings" && <ProjectSettings />}
                  </div>
                </div>
              ),
            },
            // Editor
            {
              id: "editor",
              minSize: 30,
              defaultSize: 50,
              content: <MonacoEditor onContentChange={handleCodeChange} />,
            },
            // Preview/Output
            {
              id: "preview",
              minSize: 20,
              defaultSize: 30,
              content: (
                <div className="preview-container">
                  <div className="preview-container__tabs">
                    <button
                      className={previewTab === "output" ? "active" : ""}
                      onClick={() => setPreviewTab("output")}
                    >
                      <Play size={14} /> Output
                    </button>
                    <button
                      className={previewTab === "preview" ? "active" : ""}
                      onClick={() => setPreviewTab("preview")}
                    >
                      <Eye size={14} /> Preview
                    </button>
                  </div>
                  <div className="preview-container__content">
                    {previewTab === "output" && (
                      <CodeExecutor code={currentCode} language="typescript" />
                    )}
                    {previewTab === "preview" && (
                      <PreviewPanel jsContent={currentCode} />
                    )}
                  </div>
                </div>
              ),
            },
          ]}
        />
      </main>

      {/* Status bar */}
      <ConnectionStatus />

      <style>{appStyles}</style>
    </div>
  );
}

// Join screen component
function JoinScreen({
  defaultRoomId,
  onJoin,
}: {
  defaultRoomId: string;
  onJoin: (roomId: string, name: string) => void;
}) {
  const [roomId, setRoomId] = useState(
    defaultRoomId || `room-${Date.now().toString(36)}`
  );
  const [name, setName] = useState(
    localStorage.getItem("collabplay-username") || ""
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (roomId.trim() && name.trim()) {
      onJoin(roomId.trim(), name.trim());
    }
  };

  return (
    <div className="join-screen">
      <div className="join-screen__card">
        <div className="join-screen__header">
          <Code2 size={40} />
          <h1>CollabPlay</h1>
          <p>Real-time collaborative code playground</p>
        </div>
        <form onSubmit={handleSubmit} className="join-screen__form">
          <div className="join-screen__field">
            <label>Your Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              required
            />
          </div>
          <div className="join-screen__field">
            <label>Room ID</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              placeholder="Enter or create room ID"
              required
            />
          </div>
          <button
            type="submit"
            className="join-screen__btn"
            disabled={!name.trim() || !roomId.trim()}
          >
            Join Room
          </button>
        </form>
      </div>
      <style>{joinScreenStyles}</style>
    </div>
  );
}

const appStyles = `
  .app { display: flex; flex-direction: column; height: 100vh; background: #1e1e1e; color: #ccc; }
  .app__header { display: flex; justify-content: space-between; align-items: center; padding: 8px 16px; background: #252526; border-bottom: 1px solid #333; }
  .app__logo { display: flex; align-items: center; gap: 8px; font-size: 18px; font-weight: 600; color: #fff; }
  .app__room-info { font-size: 12px; color: #888; }
  .app__main { flex: 1; overflow: hidden; }
  .sidebar { display: flex; height: 100%; background: #1e1e1e; }
  .sidebar__tabs { display: flex; flex-direction: column; gap: 4px; padding: 8px; background: #252526; border-right: 1px solid #333; }
  .sidebar__tabs button { padding: 8px; background: transparent; border: none; color: #888; cursor: pointer; border-radius: 4px; }
  .sidebar__tabs button:hover { background: #333; color: #fff; }
  .sidebar__tabs button.active { background: #333; color: #007acc; }
  .sidebar__content { flex: 1; overflow: hidden; }
  .preview-container { display: flex; flex-direction: column; height: 100%; background: #1e1e1e; }
  .preview-container__tabs { display: flex; gap: 4px; padding: 8px; background: #252526; border-bottom: 1px solid #333; }
  .preview-container__tabs button { display: flex; align-items: center; gap: 6px; padding: 6px 12px; background: transparent; border: none; color: #888; cursor: pointer; border-radius: 4px; font-size: 12px; }
  .preview-container__tabs button:hover { background: #333; color: #fff; }
  .preview-container__tabs button.active { background: #007acc; color: #fff; }
  .preview-container__content { flex: 1; overflow: hidden; }
`;

const joinScreenStyles = `
  .join-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); }
  .join-screen__card { width: 100%; max-width: 400px; padding: 40px; background: #1e1e1e; border-radius: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
  .join-screen__header { text-align: center; margin-bottom: 32px; color: #fff; }
  .join-screen__header h1 { margin: 16px 0 8px; font-size: 28px; }
  .join-screen__header p { color: #888; font-size: 14px; }
  .join-screen__form { display: flex; flex-direction: column; gap: 20px; }
  .join-screen__field { display: flex; flex-direction: column; gap: 8px; }
  .join-screen__field label { font-size: 12px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
  .join-screen__field input { padding: 12px 16px; background: #252526; border: 1px solid #333; border-radius: 8px; color: #fff; font-size: 14px; outline: none; transition: border-color 0.2s; }
  .join-screen__field input:focus { border-color: #007acc; }
  .join-screen__btn { padding: 14px; background: linear-gradient(135deg, #007acc, #0066aa); border: none; border-radius: 8px; color: #fff; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.2s; }
  .join-screen__btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(0,122,204,0.3); }
  .join-screen__btn:disabled { opacity: 0.5; cursor: not-allowed; }
`;

export default App;
