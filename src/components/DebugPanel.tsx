"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { useHistorianStore } from "@/lib/store";
import { DebugEntry } from "@/lib/types";

function formatResponse(entry: DebugEntry) {
  const resp = entry.response;

  // Phases (split-time)
  if ("phases" in resp && Array.isArray(resp.phases)) {
    return (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-sepia/20">
            <th className="text-left py-1 pr-3 font-semibold">Title</th>
            <th className="text-left py-1 pr-3 font-semibold">Start</th>
            <th className="text-left py-1 pr-3 font-semibold">End</th>
            <th className="text-left py-1 font-semibold">Summary</th>
          </tr>
        </thead>
        <tbody>
          {(resp.phases as Array<{ title: string; start: string; end: string; summary: string }>).map((p, i) => (
            <tr key={i} className="border-b border-sepia/10">
              <td className="py-1 pr-3 font-medium">{p.title}</td>
              <td className="py-1 pr-3 text-sepia/70">{p.start}</td>
              <td className="py-1 pr-3 text-sepia/70">{p.end}</td>
              <td className="py-1 text-sepia/70">{p.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Regions (split-geography)
  if ("regions" in resp && Array.isArray(resp.regions)) {
    return (
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="border-b border-sepia/20">
            <th className="text-left py-1 pr-3 font-semibold">Region</th>
            <th className="text-left py-1 font-semibold">Summary</th>
          </tr>
        </thead>
        <tbody>
          {(resp.regions as Array<{ regionName: string; summary: string }>).map((r, i) => (
            <tr key={i} className="border-b border-sepia/10">
              <td className="py-1 pr-3 font-medium">{r.regionName}</td>
              <td className="py-1 text-sepia/70">{r.summary}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // Jump-to-topic
  if ("title" in resp && "geographicScope" in resp) {
    return (
      <table className="w-full text-xs border-collapse">
        <tbody>
          {Object.entries(resp)
            .filter(([k]) => k !== "_debug")
            .map(([k, v]) => (
              <tr key={k} className="border-b border-sepia/10">
                <td className="py-1 pr-3 font-medium w-32">{k}</td>
                <td className="py-1 text-sepia/70">{String(v)}</td>
              </tr>
            ))}
        </tbody>
      </table>
    );
  }

  // Essay
  if ("essay" in resp) {
    return (
      <p className="text-xs text-sepia/70 max-h-32 overflow-y-auto">
        {String(resp.essay).slice(0, 500)}...
      </p>
    );
  }

  // Fallback
  return <pre className="text-xs text-sepia/70 overflow-x-auto">{JSON.stringify(resp, null, 2)}</pre>;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit", fractionalSecondDigits: 3 } as Intl.DateTimeFormatOptions);
}

const MIN_HEIGHT = 240; // ~10 rows of text at 12px font + padding
const DEFAULT_HEIGHT = 320;
const MAX_HEIGHT_RATIO = 0.8;

export default function DebugPanel() {
  const { debugLog, showDebug, toggleDebug } = useHistorianStore();
  const [panelHeight, setPanelHeight] = useState(DEFAULT_HEIGHT);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    startY.current = e.clientY;
    startHeight.current = panelHeight;
    e.preventDefault();
  }, [panelHeight]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      const maxHeight = window.innerHeight * MAX_HEIGHT_RATIO;
      const newHeight = Math.min(maxHeight, Math.max(MIN_HEIGHT, startHeight.current + delta));
      setPanelHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Toggle button */}
      <button
        onClick={toggleDebug}
        className="absolute -top-8 right-4 px-3 py-1 text-xs font-mono bg-ink text-parchment rounded-t-lg hover:bg-ink/80 transition-colors"
      >
        {showDebug ? "▼ Hide Debug" : "▲ Show Debug"} ({debugLog.length})
      </button>

      {showDebug && (
        <div className="bg-ink/95 backdrop-blur text-parchment border-t border-sepia/30 flex flex-col" style={{ height: panelHeight }}>
          {/* Drag handle */}
          <div
            onMouseDown={handleMouseDown}
            className="h-2 cursor-ns-resize flex items-center justify-center shrink-0 hover:bg-white/10 transition-colors"
          >
            <div className="w-12 h-0.5 bg-sepia/40 rounded-full" />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {debugLog.length === 0 ? (
              <div className="p-4 text-center text-sm text-sepia/50 font-mono">
                No API calls yet. Interact with the timeline to see debug output.
              </div>
            ) : (
              <div className="divide-y divide-sepia/20">
                {debugLog.map((entry) => (
                  <details key={entry.id} className="group">
                    <summary className="flex items-center gap-3 px-4 py-1.5 cursor-pointer hover:bg-white/5 text-xs font-mono leading-tight">
                      <span className="text-sepia/50 shrink-0 tabular-nums">
                        {formatTimestamp(entry.timestamp)}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                        entry.action === "split-time" ? "bg-navy/30 text-blue-300" :
                        entry.action === "split-geography" ? "bg-crimson/30 text-red-300" :
                        entry.action === "jump-to-topic" ? "bg-green-900/30 text-green-300" :
                        entry.action === "generate-image" ? "bg-purple-900/30 text-purple-300" :
                        "bg-sepia/30 text-amber-300"
                      }`}>
                        {entry.action}
                      </span>
                      <span className="text-sepia/40 truncate">{entry.model}</span>
                    </summary>
                    <div className="px-4 pb-3 space-y-2">
                      {/* Prompt */}
                      <div>
                        <div className="text-[10px] font-bold text-sepia/50 uppercase mb-1">Prompt</div>
                        <pre className="text-xs text-parchment/80 whitespace-pre-wrap bg-white/5 rounded p-2 max-h-40 overflow-y-auto">
                          {entry.prompt}
                        </pre>
                      </div>
                      {/* Response table */}
                      <div>
                        <div className="text-[10px] font-bold text-sepia/50 uppercase mb-1">Response</div>
                        <div className="bg-white/5 rounded p-2 overflow-x-auto">
                          {formatResponse(entry)}
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
