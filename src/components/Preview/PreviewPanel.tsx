import { useState, useRef, useEffect, useCallback } from "react";
import { RefreshCw, ExternalLink, AlertTriangle, X } from "lucide-react";
import { bundleForPreview, type VirtualFile } from "@/services/bundler";

interface PreviewPanelProps {
  htmlContent?: string;
  cssContent?: string;
  jsContent?: string;
  projectFiles?: VirtualFile[]; // All files for bundling
  autoRefresh?: boolean;
  className?: string;
}

export function PreviewPanel({
  htmlContent = "",
  cssContent = "",
  jsContent = "",
  projectFiles = [],
  autoRefresh = true,
  className = "",
}: PreviewPanelProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());
  const [bundledJs, setBundledJs] = useState<string>("");
  const [bundledCss, setBundledCss] = useState<string>("");
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bundle files when projectFiles change
  useEffect(() => {
    if (projectFiles.length === 0) {
      setBundledJs(jsContent);
      setBundledCss(cssContent);
      return;
    }

    let cancelled = false;

    const runBundle = async () => {
      try {
        const result = await bundleForPreview(projectFiles);
        if (cancelled) return;

        if (result.success) {
          setBundledJs(result.code || "");
          setBundledCss(result.css || "");
          setError(null);
        } else {
          setError(`Bundle error: ${result.error}`);
          setBundledJs("");
        }
      } catch (e) {
        if (!cancelled) {
          setError(`Bundle failed: ${(e as Error).message}`);
        }
      }
    };

    runBundle();

    return () => {
      cancelled = true;
    };
  }, [projectFiles, jsContent, cssContent]);

  // Build the preview document
  const buildDocument = useCallback(() => {
    const finalJs = bundledJs || jsContent;
    const finalCss = bundledCss || cssContent;

    const doc = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; font-family: system-ui, sans-serif; }
    ${finalCss}
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    // Capture errors
    window.onerror = function(msg, url, line, col, error) {
      window.parent.postMessage({
        type: 'preview-error',
        message: msg,
        line: line,
        col: col
      }, '*');
      return true;
    };
    
    // Capture console
    const originalLog = console.log;
    console.log = function(...args) {
      window.parent.postMessage({
        type: 'preview-log',
        args: args.map(a => String(a))
      }, '*');
      originalLog.apply(console, args);
    };
    
    try {
      ${finalJs}
    } catch (e) {
      window.parent.postMessage({
        type: 'preview-error',
        message: e.message
      }, '*');
    }
  </script>
</body>
</html>
    `.trim();
    return doc;
  }, [htmlContent, bundledCss, bundledJs, cssContent, jsContent]);

  // Refresh the preview
  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setError(null);

    if (iframeRef.current) {
      const doc = buildDocument();
      const blob = new Blob([doc], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      iframeRef.current.src = url;

      // Clean up old URL after load
      iframeRef.current.onload = () => {
        URL.revokeObjectURL(url);
        setIsRefreshing(false);
        setLastRefresh(Date.now());
      };
    }
  }, [buildDocument]);

  // Auto-refresh on content change (debounced)
  useEffect(() => {
    if (!autoRefresh) return;

    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }

    refreshTimeoutRef.current = setTimeout(() => {
      refresh();
    }, 500);

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [htmlContent, bundledCss, bundledJs, autoRefresh, refresh]);

  // Listen for messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "preview-error") {
        setError(
          `${event.data.message}${
            event.data.line ? ` (line ${event.data.line})` : ""
          }`
        );
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  // Open in new tab
  const openInNewTab = useCallback(() => {
    const doc = buildDocument();
    const blob = new Blob([doc], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
  }, [buildDocument]);

  return (
    <div className={`preview-panel ${className}`}>
      {/* Header */}
      <div className="preview-panel__header">
        <div className="preview-panel__title">
          <span>Preview</span>
          <span className="preview-panel__time">
            {new Date(lastRefresh).toLocaleTimeString()}
          </span>
        </div>
        <div className="preview-panel__actions">
          <button
            className={`preview-panel__btn ${
              isRefreshing ? "is-refreshing" : ""
            }`}
            onClick={refresh}
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            className="preview-panel__btn"
            onClick={openInNewTab}
            title="Open in new tab"
          >
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* Error overlay */}
      {error && (
        <div className="preview-panel__error">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* Iframe */}
      <div className="preview-panel__content">
        <iframe
          ref={iframeRef}
          className="preview-panel__iframe"
          title="Preview"
          sandbox="allow-scripts allow-modals allow-forms"
        />
      </div>

      <style>{previewPanelStyles}</style>
    </div>
  );
}

const previewPanelStyles = `
  .preview-panel { display: flex; flex-direction: column; height: 100%; background: #fff; border-radius: 8px; overflow: hidden; }
  .preview-panel__header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #f5f5f5; border-bottom: 1px solid #e0e0e0; }
  .preview-panel__title { display: flex; align-items: center; gap: 12px; font-weight: 500; color: #333; }
  .preview-panel__time { font-size: 11px; color: #888; font-weight: normal; }
  .preview-panel__actions { display: flex; gap: 4px; }
  .preview-panel__btn { display: flex; align-items: center; padding: 6px; background: transparent; border: none; color: #666; cursor: pointer; border-radius: 4px; transition: all 0.15s ease; }
  .preview-panel__btn:hover { background: #e0e0e0; color: #333; }
  .preview-panel__btn.is-refreshing { animation: spin 1s linear infinite; }
  .preview-panel__error { display: flex; align-items: center; gap: 8px; padding: 8px 12px; background: #fef2f2; color: #dc2626; font-size: 12px; border-bottom: 1px solid #fecaca; }
  .preview-panel__error span { flex: 1; }
  .preview-panel__error button { padding: 2px; background: transparent; border: none; color: #dc2626; cursor: pointer; }
  .preview-panel__content { flex: 1; min-height: 0; }
  .preview-panel__iframe { width: 100%; height: 100%; border: none; background: #fff; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

export default PreviewPanel;
