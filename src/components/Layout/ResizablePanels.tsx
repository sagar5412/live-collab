import {
  useState,
  useRef,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

interface Panel {
  id: string;
  minSize?: number;
  defaultSize?: number;
  content: ReactNode;
}

interface ResizablePanelsProps {
  panels: Panel[];
  direction?: "horizontal" | "vertical";
  storageKey?: string;
  className?: string;
}

export function ResizablePanels({
  panels,
  direction = "horizontal",
  storageKey,
  className = "",
}: ResizablePanelsProps) {
  // Initialize sizes from localStorage or defaults
  const getInitialSizes = useCallback(() => {
    if (storageKey) {
      const stored = localStorage.getItem(`panel-sizes-${storageKey}`);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          // Invalid stored value
        }
      }
    }
    // Use default sizes
    const totalDefault = panels.reduce(
      (sum, p) => sum + (p.defaultSize || 100 / panels.length),
      0
    );
    return panels.map(
      (p) => ((p.defaultSize || 100 / panels.length) / totalDefault) * 100
    );
  }, [panels, storageKey]);

  const [sizes, setSizes] = useState<number[]>(getInitialSizes);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const dragIndexRef = useRef<number>(0);
  const startPosRef = useRef(0);
  const startSizesRef = useRef<number[]>([]);

  // Save sizes to localStorage
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(`panel-sizes-${storageKey}`, JSON.stringify(sizes));
    }
  }, [sizes, storageKey]);

  // Handle drag start
  const handleDragStart = useCallback(
    (index: number, e: React.MouseEvent) => {
      e.preventDefault();
      isDraggingRef.current = true;
      dragIndexRef.current = index;
      startPosRef.current = direction === "horizontal" ? e.clientX : e.clientY;
      startSizesRef.current = [...sizes];
      document.body.style.cursor =
        direction === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
    },
    [direction, sizes]
  );

  // Handle drag
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerSize =
        direction === "horizontal" ? containerRect.width : containerRect.height;
      const currentPos = direction === "horizontal" ? e.clientX : e.clientY;
      const delta = ((currentPos - startPosRef.current) / containerSize) * 100;

      const index = dragIndexRef.current;
      const minSize = panels[index].minSize || 10;
      const nextMinSize = panels[index + 1]?.minSize || 10;

      const newSizes = [...startSizesRef.current];
      let newLeft = newSizes[index] + delta;
      let newRight = newSizes[index + 1] - delta;

      // Enforce min sizes
      if (newLeft < minSize) {
        newLeft = minSize;
        newRight =
          startSizesRef.current[index] +
          startSizesRef.current[index + 1] -
          minSize;
      }
      if (newRight < nextMinSize) {
        newRight = nextMinSize;
        newLeft =
          startSizesRef.current[index] +
          startSizesRef.current[index + 1] -
          nextMinSize;
      }

      newSizes[index] = newLeft;
      newSizes[index + 1] = newRight;
      setSizes(newSizes);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [direction, panels]);

  return (
    <div
      ref={containerRef}
      className={`resizable-panels resizable-panels--${direction} ${className}`}
    >
      {panels.map((panel, index) => (
        <div
          key={panel.id}
          className="resizable-panels__wrapper"
          style={{ flexBasis: `${sizes[index]}%` }}
        >
          <div className="resizable-panels__panel">{panel.content}</div>
          {index < panels.length - 1 && (
            <div
              className={`resizable-panels__divider resizable-panels__divider--${direction}`}
              onMouseDown={(e) => handleDragStart(index, e)}
            >
              <div className="resizable-panels__handle" />
            </div>
          )}
        </div>
      ))}
      <style>{resizableStyles}</style>
    </div>
  );
}

const resizableStyles = `
  .resizable-panels { display: flex; height: 100%; width: 100%; overflow: hidden; }
  .resizable-panels--horizontal { flex-direction: row; }
  .resizable-panels--vertical { flex-direction: column; }
  .resizable-panels__wrapper { display: flex; min-width: 0; min-height: 0; overflow: hidden; }
  .resizable-panels--horizontal .resizable-panels__wrapper { flex-direction: row; }
  .resizable-panels--vertical .resizable-panels__wrapper { flex-direction: column; }
  .resizable-panels__panel { flex: 1; overflow: hidden; }
  .resizable-panels__divider { display: flex; align-items: center; justify-content: center; background: #1e1e1e; transition: background 0.15s ease; z-index: 10; }
  .resizable-panels__divider--horizontal { width: 4px; cursor: col-resize; }
  .resizable-panels__divider--vertical { height: 4px; cursor: row-resize; }
  .resizable-panels__divider:hover { background: #007acc; }
  .resizable-panels__handle { background: #444; border-radius: 2px; transition: background 0.15s ease; }
  .resizable-panels__divider--horizontal .resizable-panels__handle { width: 2px; height: 40px; }
  .resizable-panels__divider--vertical .resizable-panels__handle { width: 40px; height: 2px; }
  .resizable-panels__divider:hover .resizable-panels__handle { background: #007acc; }
`;

export default ResizablePanels;
