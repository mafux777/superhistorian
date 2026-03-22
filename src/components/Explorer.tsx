"use client";

import { useCallback, useEffect, useRef } from "react";
import { useHistorianStore } from "@/lib/store";
import { HistoryNode } from "@/lib/types";
import { v4 } from "@/lib/uuid";
import SearchBar from "./SearchBar";
import NodeGrid from "./NodeGrid";
import LoadingSkeleton from "./LoadingSkeleton";
import EssayModal from "./EssayModal";
import ModelSelector from "./ModelSelector";
import ImageModelSelector from "./ImageModelSelector";
import LanguageSelector from "./LanguageSelector";
import DebugPanel from "./DebugPanel";
import { motion, AnimatePresence } from "framer-motion";

// A single level in the vertical exploration thread
function ExplorationLevel({
  node,
  selectedChildId,
  depth,
  onSplitTime,
  onSplitGeo,
  onSelectChild,
  onEssay,
  isLoading,
  isDeepest,
}: {
  node: HistoryNode;
  selectedChildId: string | null;
  depth: number;
  onSplitTime: (node: HistoryNode) => void;
  onSplitGeo: (node: HistoryNode) => void;
  onSelectChild: (node: HistoryNode) => void;
  onEssay: (node: HistoryNode) => void;
  isLoading: boolean;
  isDeepest: boolean;
}) {
  const hasChildren = node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="relative"
    >
      {/* Connector line from parent */}
      {depth > 0 && (
        <div className="absolute left-8 -top-6 w-0.5 h-6 bg-sepia/20" />
      )}

      {/* Level header - shows what node we're looking at */}
      {depth > 0 && (
        <div className="mb-3">
          <div className="bg-white/60 backdrop-blur border-2 border-sepia/20 rounded-2xl p-4 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 py-0.5 bg-sepia/10 rounded-full text-[11px] font-mono text-ink/70">
                    {node.timeRange.start}
                  </span>
                  <span className="text-ink/30 text-xs">→</span>
                  <span className="px-2 py-0.5 bg-sepia/10 rounded-full text-[11px] font-mono text-ink/70">
                    {node.timeRange.end}
                  </span>
                  <span className="px-2 py-0.5 bg-crimson/10 text-crimson rounded-full text-[11px] font-mono">
                    📍 {node.geographicScope}
                  </span>
                  <span className="px-2 py-0.5 bg-ink/5 rounded-full text-[11px] font-mono text-ink/40">
                    Depth {node.depth}
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-ink mb-1">
                  {node.title}
                </h3>
                <p className="font-serif text-sm text-ink/70 leading-relaxed">
                  {node.summary}
                </p>
              </div>
            </div>

            {/* Action buttons - only show on the deepest selected node */}
            {isDeepest && (
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-sepia/10">
                <button
                  onClick={() => onSplitTime(node)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-serif bg-navy text-white rounded-lg hover:bg-navy/80 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  ⏳ Split by Time
                </button>
                <button
                  onClick={() => onSplitGeo(node)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-serif bg-crimson text-white rounded-lg hover:bg-crimson/80 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  🗺️ Split by Geography
                </button>
                <button
                  onClick={() => onEssay(node)}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-serif bg-sepia text-parchment rounded-lg hover:bg-brass transition-colors disabled:opacity-40 flex items-center gap-1.5"
                >
                  📝 Essay
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Children grid */}
      {hasChildren && (
        <div className="mb-6">
          <NodeGrid
            nodes={node.children}
            onSplitTime={onSplitTime}
            onSplitGeo={onSplitGeo}
            onDrillDown={onSelectChild}
            onEssay={onEssay}
            isLoading={isLoading}
            splitAxis={node.splitAxis}
            selectedChildId={selectedChildId}
          />
        </div>
      )}

      {/* Loading skeleton at the deepest level */}
      {isLoading && isDeepest && !hasChildren && (
        <div className="mb-6">
          <LoadingSkeleton />
        </div>
      )}
    </motion.div>
  );
}

export default function Explorer() {
  const {
    tree,
    currentPath,
    currentNode,
    isLoading,
    setLoading,
    setChildren,
    navigateTo,
    setEssay,
    setEssayLoading,
    addDebugEntry,
    findNode,
  } = useHistorianStore();

  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-split root on first load
  useEffect(() => {
    if (tree.id === "root" && tree.children.length === 0) {
      handleSplitTime(tree);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-scroll to bottom when path changes
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [currentPath]);

  const handleSplitTime = useCallback(
    async (node: HistoryNode) => {
      if (node.children.length > 0 && node.splitAxis === "time") {
        navigateTo(node.id);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "split-time", node, model: useHistorianStore.getState().selectedModel, language: useHistorianStore.getState().selectedLanguage }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (data._debug) {
          addDebugEntry({ action: "split-time", model: data._debug.model, prompt: data._debug.prompt, response: data });
        }

        const children: HistoryNode[] = data.phases.map(
          (phase: { title: string; start: string; end: string; summary: string }) => ({
            id: v4(),
            title: phase.title,
            summary: phase.summary,
            timeRange: { start: phase.start, end: phase.end },
            geographicScope: node.geographicScope,
            parentId: node.id,
            children: [],
            splitAxis: null,
            depth: node.depth + 1,
          })
        );

        setChildren(node.id, children, "time");
        navigateTo(node.id);
      } catch (err) {
        console.error("Split by time failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setChildren, navigateTo, addDebugEntry]
  );

  const handleSplitGeo = useCallback(
    async (node: HistoryNode) => {
      if (node.children.length > 0 && node.splitAxis === "geography") {
        navigateTo(node.id);
        return;
      }
      setLoading(true);
      try {
        const res = await fetch("/api/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "split-geography", node, model: useHistorianStore.getState().selectedModel, language: useHistorianStore.getState().selectedLanguage }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (data._debug) {
          addDebugEntry({ action: "split-geography", model: data._debug.model, prompt: data._debug.prompt, response: data });
        }

        const children: HistoryNode[] = data.regions.map(
          (region: { regionName: string; summary: string }) => ({
            id: v4(),
            title: region.regionName,
            summary: region.summary,
            timeRange: { ...node.timeRange },
            geographicScope: region.regionName,
            parentId: node.id,
            children: [],
            splitAxis: null,
            depth: node.depth + 1,
          })
        );

        setChildren(node.id, children, "geography");
        navigateTo(node.id);
      } catch (err) {
        console.error("Split by geo failed:", err);
      } finally {
        setLoading(false);
      }
    },
    [setLoading, setChildren, navigateTo, addDebugEntry]
  );

  const handleSelectChild = useCallback(
    (node: HistoryNode) => {
      // Navigate to this child — this changes the path, which
      // will hide any previous subtree at this level and show this one
      navigateTo(node.id);
    },
    [navigateTo]
  );

  const handleEssay = useCallback(
    async (node: HistoryNode) => {
      setEssayLoading(true);
      setEssay(null);
      navigateTo(node.id);
      try {
        const res = await fetch("/api/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "essay", node, model: useHistorianStore.getState().selectedModel, language: useHistorianStore.getState().selectedLanguage }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        if (data._debug) {
          addDebugEntry({ action: "essay", model: data._debug.model, prompt: data._debug.prompt, response: data });
        }

        setEssay(data.essay);
      } catch (err) {
        console.error("Essay generation failed:", err);
        setEssay("Failed to generate essay. Please try again.");
      } finally {
        setEssayLoading(false);
      }
    },
    [setEssay, setEssayLoading, navigateTo, addDebugEntry]
  );

  // Build the vertical thread: walk the currentPath and resolve each node
  const levels: { node: HistoryNode; selectedChildId: string | null }[] = [];
  for (let i = 0; i < currentPath.length; i++) {
    const node = findNode(currentPath[i]);
    if (!node) break;
    const selectedChildId = i + 1 < currentPath.length ? currentPath[i + 1] : null;
    levels.push({ node, selectedChildId });
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment via-parchment to-amber-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-md border-b border-sepia/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h1
              className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2 cursor-pointer"
              onClick={() => navigateTo("root")}
            >
              <span className="text-3xl">📚</span>
              <span className="bg-gradient-to-r from-ink to-sepia bg-clip-text text-transparent">
                Super Historian
              </span>
            </h1>
            <div className="hidden sm:flex items-center gap-3">
              <span className="text-xs text-sepia/60 font-serif">
                Depth: {currentNode.depth} | Nodes: {countNodes(tree)}
              </span>
              <ModelSelector />
              <ImageModelSelector />
              <LanguageSelector />
            </div>
          </div>
          <SearchBar />
          {/* Breadcrumb trail - compact */}
          {currentPath.length > 1 && (
            <div className="flex items-center gap-1 mt-2 overflow-x-auto text-xs font-serif text-sepia/60 pb-1">
              {levels.map((level, i) => (
                <span key={level.node.id} className="flex items-center gap-1 shrink-0">
                  {i > 0 && <span className="text-sepia/30">›</span>}
                  <button
                    onClick={() => navigateTo(level.node.id)}
                    className={`hover:text-ink transition-colors truncate max-w-[150px] ${
                      i === levels.length - 1 ? "text-ink font-semibold" : ""
                    }`}
                  >
                    {level.node.title}
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </header>

      {/* Main content — vertical exploration thread */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Root hero when no children yet */}
        {currentPath.length === 1 && tree.children.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
              className="text-8xl mb-6"
            >
              🌍
            </motion.div>
            <h2 className="font-display text-3xl font-bold text-ink mb-4">
              {tree.title}
            </h2>
            <p className="font-serif text-ink/70 max-w-lg mb-8 text-lg leading-relaxed">
              {tree.summary}
            </p>
            <button
              onClick={() => handleSplitTime(tree)}
              className="px-8 py-4 bg-navy text-white font-display text-lg rounded-2xl hover:bg-navy/80 transition-all hover:scale-105 shadow-lg"
            >
              ⏳ Begin the Journey
            </button>
          </div>
        )}

        {/* Vertical thread of exploration levels */}
        {levels.map((level, i) => {
          // Only show levels that have children (or are loading at the deepest)
          const hasContent = level.node.children.length > 0;
          const isDeepest = i === levels.length - 1;
          if (!hasContent && !isDeepest) return null;

          return (
            <ExplorationLevel
              key={level.node.id}
              node={level.node}
              selectedChildId={level.selectedChildId}
              depth={i}
              onSplitTime={handleSplitTime}
              onSplitGeo={handleSplitGeo}
              onSelectChild={handleSelectChild}
              onEssay={handleEssay}
              isLoading={isLoading}
              isDeepest={isDeepest}
            />
          );
        })}

        <div ref={bottomRef} />
      </main>

      {/* Essay Modal */}
      <EssayModal />

      {/* Debug Panel */}
      <DebugPanel />

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-sepia/40 font-serif">
        Super Historian — Explore the infinite depth of history
      </footer>
    </div>
  );
}

function countNodes(node: HistoryNode): number {
  return 1 + node.children.reduce((sum, child) => sum + countNodes(child), 0);
}
