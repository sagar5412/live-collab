import { useUserPresence } from "@/hooks/useUserPresence";
import type { CollaborationUser } from "@/types/collaboration";

interface UserCursorsProps {
  className?: string;
}

/**
 * UserCursors component - displays a list of active users in the room.
 * The actual cursor rendering in Monaco is handled by yjs-monaco.ts.
 * This component shows user presence in a sidebar or overlay.
 */
export function UserCursors({ className = "" }: UserCursorsProps) {
  const { users, currentUser, getOtherUsers } = useUserPresence();
  const otherUsers = getOtherUsers();

  if (users.length === 0) {
    return null;
  }

  return (
    <div className={`user-cursors ${className}`}>
      {/* Current user indicator */}
      {currentUser && (
        <div className="user-cursors__current">
          <UserBadge user={currentUser} isCurrentUser />
        </div>
      )}

      {/* Other users */}
      {otherUsers.length > 0 && (
        <div className="user-cursors__others">
          {otherUsers.map((user) => (
            <UserBadge key={user.id} user={user} />
          ))}
        </div>
      )}

      <style>{`
        .user-cursors {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px;
        }

        .user-cursors__current {
          display: flex;
          align-items: center;
        }

        .user-cursors__others {
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .user-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 500;
          color: white;
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: default;
        }

        .user-badge:hover {
          transform: scale(1.05);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
        }

        .user-badge--current {
          border: 2px solid white;
        }

        .user-badge__avatar {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 600;
        }

        .user-badge__name {
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .user-badge__cursor-indicator {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.8);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
}

interface UserBadgeProps {
  user: CollaborationUser;
  isCurrentUser?: boolean;
}

function UserBadge({ user, isCurrentUser = false }: UserBadgeProps) {
  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div
      className={`user-badge ${isCurrentUser ? "user-badge--current" : ""}`}
      style={{ backgroundColor: user.color }}
      title={`${user.name}${isCurrentUser ? " (you)" : ""}`}
    >
      <div className="user-badge__avatar">{initials}</div>
      <span className="user-badge__name">{user.name}</span>
      {user.cursor && <div className="user-badge__cursor-indicator" />}
    </div>
  );
}

export default UserCursors;
