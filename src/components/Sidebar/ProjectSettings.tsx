import { useState, useCallback } from "react";
import { Copy, Check, Link, Users, Hash, Settings } from "lucide-react";
import { useCollaboration } from "@/hooks/useCollaboration";
import { useUserPresence } from "@/hooks/useUserPresence";

interface ProjectSettingsProps {
  className?: string;
}

export function ProjectSettings({ className = "" }: ProjectSettingsProps) {
  const { roomState, leaveRoom } = useCollaboration();
  const { users, currentUser } = useUserPresence();
  const [copied, setCopied] = useState(false);

  // Generate shareable link
  const shareableLink = roomState.roomId
    ? `${window.location.origin}?room=${roomState.roomId}`
    : "";

  // Copy link to clipboard
  const handleCopyLink = useCallback(async () => {
    if (!shareableLink) return;

    try {
      await navigator.clipboard.writeText(shareableLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy link:", error);
    }
  }, [shareableLink]);

  // Copy room ID
  const handleCopyRoomId = useCallback(async () => {
    if (!roomState.roomId) return;

    try {
      await navigator.clipboard.writeText(roomState.roomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy room ID:", error);
    }
  }, [roomState.roomId]);

  if (!roomState.roomId) {
    return (
      <div
        className={`project-settings project-settings--disconnected ${className}`}
      >
        <div className="project-settings__disconnected">
          <Settings size={24} className="text-gray-500" />
          <p>Not connected to a room</p>
        </div>
        <style>{projectSettingsStyles}</style>
      </div>
    );
  }

  return (
    <div className={`project-settings ${className}`}>
      {/* Room ID Section */}
      <div className="project-settings__section">
        <div className="project-settings__section-header">
          <Hash size={14} />
          <span>Room ID</span>
        </div>
        <div className="project-settings__room-id">
          <code className="project-settings__room-code">
            {roomState.roomId}
          </code>
          <button
            className="project-settings__copy-btn"
            onClick={handleCopyRoomId}
            title="Copy Room ID"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* Share Link Section */}
      <div className="project-settings__section">
        <div className="project-settings__section-header">
          <Link size={14} />
          <span>Share Link</span>
        </div>
        <button
          className="project-settings__share-btn"
          onClick={handleCopyLink}
        >
          {copied ? (
            <>
              <Check size={14} />
              Copied!
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Invite Link
            </>
          )}
        </button>
      </div>

      {/* Collaborators Section */}
      <div className="project-settings__section">
        <div className="project-settings__section-header">
          <Users size={14} />
          <span>Collaborators ({users.length})</span>
        </div>
        <div className="project-settings__users">
          {users.map((user) => (
            <div
              key={user.id}
              className={`project-settings__user ${
                user.id === currentUser?.id
                  ? "project-settings__user--current"
                  : ""
              }`}
            >
              <div
                className="project-settings__user-avatar"
                style={{ backgroundColor: user.color }}
              >
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="project-settings__user-name">
                {user.name}
                {user.id === currentUser?.id && " (you)"}
              </span>
              {user.cursor && (
                <span className="project-settings__user-active" title="Active">
                  •
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Leave Room Button */}
      <div className="project-settings__section project-settings__section--danger">
        <button className="project-settings__leave-btn" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <style>{projectSettingsStyles}</style>
    </div>
  );
}

const projectSettingsStyles = `
  .project-settings {
    padding: 16px;
    color: #ccc;
    font-size: 13px;
  }

  .project-settings--disconnected {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
  }

  .project-settings__disconnected {
    text-align: center;
    color: #666;
  }

  .project-settings__disconnected p {
    margin-top: 12px;
  }

  .project-settings__section {
    margin-bottom: 20px;
  }

  .project-settings__section-header {
    display: flex;
    align-items: center;
    gap: 6px;
    color: #888;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .project-settings__room-id {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #252526;
    padding: 8px 12px;
    border-radius: 6px;
  }

  .project-settings__room-code {
    flex: 1;
    font-family: monospace;
    font-size: 12px;
    color: #e0e0e0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .project-settings__copy-btn {
    padding: 4px;
    background: transparent;
    border: none;
    color: #888;
    cursor: pointer;
    border-radius: 4px;
  }

  .project-settings__copy-btn:hover {
    background: #333;
    color: #fff;
  }

  .project-settings__share-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    width: 100%;
    padding: 10px;
    background: linear-gradient(135deg, #007acc, #0066aa);
    border: none;
    color: white;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .project-settings__share-btn:hover {
    background: linear-gradient(135deg, #0088dd, #0077bb);
    transform: translateY(-1px);
  }

  .project-settings__users {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .project-settings__user {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 8px 12px;
    background: #252526;
    border-radius: 6px;
  }

  .project-settings__user--current {
    border: 1px solid #333;
  }

  .project-settings__user-avatar {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 12px;
  }

  .project-settings__user-name {
    flex: 1;
  }

  .project-settings__user-active {
    color: #4ade80;
    font-size: 20px;
    line-height: 1;
  }

  .project-settings__section--danger {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 1px solid #333;
  }

  .project-settings__leave-btn {
    width: 100%;
    padding: 10px;
    background: transparent;
    border: 1px solid #dc2626;
    color: #dc2626;
    font-size: 13px;
    font-weight: 500;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .project-settings__leave-btn:hover {
    background: #dc2626;
    color: white;
  }

  .text-gray-500 { color: #6b7280; }
`;

export default ProjectSettings;
