"use client";

import { useState, useEffect, useRef } from "react";
import { useHistorianStore } from "@/lib/store";

interface Model {
  id: string;
  name: string;
  created: number;
  contextLength: number;
  promptPrice: string;
  completionPrice: string;
}

export default function ModelSelector() {
  const { selectedModel, setSelectedModel } = useHistorianStore();
  const [models, setModels] = useState<Model[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch models on first open
  const fetchModels = async () => {
    if (models.length > 0) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/models");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setModels(data.models);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load models");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !isOpen;
    setIsOpen(next);
    if (next) fetchModels();
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const displayName = models.find((m) => m.id === selectedModel)?.name || selectedModel.split("/").pop() || "Select model";

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleToggle}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono text-sepia border border-sepia/30 rounded-lg hover:bg-sepia/10 transition-colors truncate max-w-[240px]"
        title={selectedModel}
      >
        <span className="text-xs">🤖</span>
        <span className="truncate">{displayName}</span>
        <span className="text-[10px] ml-1">{isOpen ? "▲" : "▼"}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-80 max-h-96 overflow-y-auto bg-white border border-sepia/20 rounded-xl shadow-xl z-50">
          {isLoading && (
            <div className="p-4 text-center text-sm text-sepia/60 font-serif">
              Loading models...
            </div>
          )}
          {error && (
            <div className="p-4 text-center text-sm text-crimson font-serif">
              {error}
            </div>
          )}
          {models.map((model) => (
            <button
              key={model.id}
              onClick={() => {
                setSelectedModel(model.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 hover:bg-sepia/5 transition-colors border-b border-sepia/5 last:border-0 ${
                model.id === selectedModel ? "bg-sepia/10" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-serif text-sm text-ink font-medium truncate">
                  {model.name}
                </span>
                {model.id === selectedModel && (
                  <span className="text-xs text-navy">✓</span>
                )}
              </div>
              <div className="flex items-center gap-3 mt-1 text-[11px] text-sepia/60 font-mono">
                <span>{(model.contextLength / 1024).toFixed(0)}K ctx</span>
                <span>${parseFloat(model.promptPrice) * 1e6}/M in</span>
                <span>${parseFloat(model.completionPrice) * 1e6}/M out</span>
                <span>{new Date(model.created * 1000).toLocaleDateString()}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
