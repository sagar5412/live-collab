interface LoadingSkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: "text" | "rectangular" | "circular";
  animation?: "shimmer" | "pulse" | "none";
}

export function LoadingSkeleton({
  width = "100%",
  height = 20,
  borderRadius,
  className = "",
  variant = "rectangular",
  animation = "shimmer",
}: LoadingSkeletonProps) {
  const getRadius = () => {
    if (borderRadius) return borderRadius;
    switch (variant) {
      case "circular":
        return "50%";
      case "text":
        return 4;
      default:
        return 8;
    }
  };

  return (
    <div
      className={`loading-skeleton loading-skeleton--${animation} ${className}`}
      style={{
        width: typeof width === "number" ? `${width}px` : width,
        height: typeof height === "number" ? `${height}px` : height,
        borderRadius:
          typeof getRadius() === "number" ? `${getRadius()}px` : getRadius(),
      }}
    >
      <style>{`
        .loading-skeleton {
          background: var(--color-bg-tertiary);
          position: relative;
          overflow: hidden;
        }
        .loading-skeleton--shimmer::after {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.1),
            transparent
          );
          animation: shimmer 1.5s infinite;
        }
        .loading-skeleton--pulse {
          animation: pulse 1.5s ease-in-out infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

// Preset skeleton components for common use cases
export function TextSkeleton({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={`text-skeleton ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <LoadingSkeleton
          key={i}
          height={14}
          width={i === lines - 1 ? "60%" : "100%"}
          variant="text"
          className="text-skeleton__line"
        />
      ))}
      <style>{`
        .text-skeleton { display: flex; flex-direction: column; gap: 8px; }
      `}</style>
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`card-skeleton ${className}`}>
      <LoadingSkeleton height={120} borderRadius={8} />
      <div className="card-skeleton__content">
        <LoadingSkeleton height={20} width="80%" />
        <LoadingSkeleton height={14} width="60%" />
      </div>
      <style>{`
        .card-skeleton {
          background: var(--color-bg-secondary);
          border-radius: var(--radius-lg);
          overflow: hidden;
        }
        .card-skeleton__content {
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
      `}</style>
    </div>
  );
}

export function EditorSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`editor-skeleton ${className}`}>
      <div className="editor-skeleton__tabs">
        <LoadingSkeleton width={100} height={32} />
        <LoadingSkeleton width={100} height={32} />
      </div>
      <div className="editor-skeleton__content">
        {Array.from({ length: 12 }).map((_, i) => (
          <LoadingSkeleton
            key={i}
            height={18}
            width={`${Math.random() * 40 + 30}%`}
            variant="text"
          />
        ))}
      </div>
      <style>{`
        .editor-skeleton {
          display: flex;
          flex-direction: column;
          height: 100%;
          background: var(--color-bg-primary);
        }
        .editor-skeleton__tabs {
          display: flex;
          gap: var(--spacing-xs);
          padding: var(--spacing-sm);
          background: var(--color-bg-secondary);
          border-bottom: 1px solid var(--color-border);
        }
        .editor-skeleton__content {
          flex: 1;
          padding: var(--spacing-md);
          display: flex;
          flex-direction: column;
          gap: var(--spacing-sm);
        }
      `}</style>
    </div>
  );
}

export default LoadingSkeleton;
