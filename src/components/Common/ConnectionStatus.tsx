import { Wifi, WifiOff, Users, RefreshCw, CheckCircle } from "lucide-react";
import { useCollaboration } from "@/hooks/useCollaboration";

interface ConnectionStatusProps {
  className?: string;
}

export function ConnectionStatus({ className = "" }: ConnectionStatusProps) {
  const { roomState } = useCollaboration();
  const { connectionStatus, users, isConnected, roomId } = roomState;

  // Status config
  const statusConfig = {
    connected: {
      icon: <Wifi size={14} />,
      label: "Connected",
      color: "#22c55e",
    },
    connecting: {
      icon: <RefreshCw size={14} className="animate-spin" />,
      label: "Connecting...",
      color: "#f59e0b",
    },
    disconnected: {
      icon: <WifiOff size={14} />,
      label: "Disconnected",
      color: "#ef4444",
    },
    error: { icon: <WifiOff size={14} />, label: "Error", color: "#ef4444" },
  };

  const config = statusConfig[connectionStatus];

  return (
    <div className={`connection-status ${className}`}>
      {/* Connection indicator */}
      <div
        className="connection-status__indicator"
        style={{ color: config.color }}
      >
        {config.icon}
        <span className="connection-status__label">{config.label}</span>
      </div>

      {/* Room ID */}
      {roomId && (
        <div className="connection-status__room">
          <span className="connection-status__room-label">Room:</span>
          <code className="connection-status__room-id">
            {roomId.slice(0, 8)}...
          </code>
        </div>
      )}

      {/* Users count */}
      {isConnected && (
        <div className="connection-status__users">
          <Users size={14} />
          <span>{users.length}</span>
        </div>
      )}

      {/* Sync indicator */}
      {isConnected && (
        <div className="connection-status__sync">
          <CheckCircle size={14} />
          <span>Synced</span>
        </div>
      )}

      <style>{`
        .connection-status {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 8px 16px;
          background: #1a1a1a;
          border-top: 1px solid #333;
          font-size: 12px;
          color: #888;
        }
        .connection-status__indicator {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 500;
        }
        .connection-status__label { color: inherit; }
        .connection-status__room {
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .connection-status__room-label { color: #666; }
        .connection-status__room-id {
          background: #252526;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
        }
        .connection-status__users, .connection-status__sync {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .connection-status__sync { color: #22c55e; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default ConnectionStatus;
