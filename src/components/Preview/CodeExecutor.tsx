import { useRef, useEffect, type ReactNode } from "react";
import {
  Play,
  Square,
  Trash2,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";
import { useCodeExecution } from "@/hooks/useCodeExecution";
import type { ExecutionStatus, OutputLine } from "@/services/code-execution";

interface CodeExecutorProps {
  code: string;
  language: string;
  className?: string;
}

// Status badge component
function StatusBadge({ status }: { status: ExecutionStatus }) {
  const config: Record<
    ExecutionStatus,
    { icon: ReactNode; label: string; className: string }
  > = {
    idle: {
      icon: <Clock size={12} />,
      label: "Ready",
      className: "status--idle",
    },
    connecting: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: "Connecting",
      className: "status--connecting",
    },
    running: {
      icon: <Loader2 size={12} className="animate-spin" />,
      label: "Running",
      className: "status--running",
    },
    completed: {
      icon: <CheckCircle size={12} />,
      label: "Completed",
      className: "status--completed",
    },
    error: {
      icon: <XCircle size={12} />,
      label: "Error",
      className: "status--error",
    },
    timeout: {
      icon: <Clock size={12} />,
      label: "Timeout",
      className: "status--timeout",
    },
  };

  const { icon, label, className } = config[status];

  return (
    <span className={`status-badge ${className}`}>
      {icon}
      {label}
    </span>
  );
}

// Output line component
function OutputLineComponent({ line }: { line: OutputLine }) {
  const className = `output-line output-line--${line.type}`;
  return <div className={className}>{line.content}</div>;
}

export function CodeExecutor({
  code,
  language,
  className = "",
}: CodeExecutorProps) {
  const { status, output, isRunning, execute, stop, clear } =
    useCodeExecution();
  const outputRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new output
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output]);

  // Handle run
  const handleRun = () => {
    if (!code.trim()) return;
    execute(code, language);
  };

  return (
    <div className={`code-executor ${className}`}>
      {/* Header */}
      <div className="code-executor__header">
        <div className="code-executor__title">
          <span>Output</span>
          <StatusBadge status={status} />
        </div>
        <div className="code-executor__actions">
          {isRunning ? (
            <button
              className="code-executor__btn code-executor__btn--stop"
              onClick={stop}
              title="Stop"
            >
              <Square size={14} />
              Stop
            </button>
          ) : (
            <button
              className="code-executor__btn code-executor__btn--run"
              onClick={handleRun}
              disabled={!code.trim()}
              title="Run"
            >
              <Play size={14} />
              Run
            </button>
          )}
          <button
            className="code-executor__btn code-executor__btn--clear"
            onClick={clear}
            disabled={output.length === 0}
            title="Clear"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Output area */}
      <div className="code-executor__output" ref={outputRef}>
        {output.length === 0 ? (
          <div className="code-executor__empty">
            <p>No output yet</p>
            <p className="code-executor__hint">
              Click Run to execute your code
            </p>
          </div>
        ) : (
          output.map((line, index) => (
            <OutputLineComponent key={index} line={line} />
          ))
        )}
      </div>

      <style>{`
        .code-executor { display: flex; flex-direction: column; height: 100%; background: #1e1e1e; color: #ccc; font-family: 'JetBrains Mono', monospace; font-size: 13px; }
        .code-executor__header { display: flex; justify-content: space-between; align-items: center; padding: 8px 12px; background: #252526; border-bottom: 1px solid #333; }
        .code-executor__title { display: flex; align-items: center; gap: 12px; font-weight: 500; }
        .code-executor__actions { display: flex; gap: 8px; }
        .code-executor__btn { display: flex; align-items: center; gap: 6px; padding: 6px 12px; border: none; border-radius: 4px; font-size: 12px; cursor: pointer; transition: all 0.15s ease; }
        .code-executor__btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .code-executor__btn--run { background: linear-gradient(135deg, #22c55e, #16a34a); color: white; }
        .code-executor__btn--run:hover:not(:disabled) { background: linear-gradient(135deg, #16a34a, #15803d); }
        .code-executor__btn--stop { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; }
        .code-executor__btn--clear { background: #333; color: #888; }
        .code-executor__btn--clear:hover:not(:disabled) { background: #444; color: #fff; }
        .code-executor__output { flex: 1; overflow-y: auto; padding: 12px; font-size: 12px; line-height: 1.5; }
        .code-executor__empty { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: #666; text-align: center; }
        .code-executor__hint { font-size: 11px; color: #555; margin-top: 8px; }
        .output-line { padding: 2px 0; white-space: pre-wrap; word-break: break-all; }
        .output-line--stdout { color: #e0e0e0; }
        .output-line--stderr { color: #f87171; }
        .output-line--system { color: #60a5fa; font-style: italic; }
        .status-badge { display: flex; align-items: center; gap: 4px; padding: 4px 8px; border-radius: 12px; font-size: 11px; font-weight: 500; }
        .status--idle { background: #333; color: #888; }
        .status--connecting, .status--running { background: #3b82f622; color: #60a5fa; }
        .status--completed { background: #22c55e22; color: #4ade80; }
        .status--error, .status--timeout { background: #ef444422; color: #f87171; }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default CodeExecutor;
