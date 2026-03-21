"use client";

import { useCallback, useEffect } from "react";
import { useHistorianStore } from "@/lib/store";
import { HistoryNode } from "@/lib/types";
import { v4 } from "@/lib/uuid";
import Breadcrumb from "./Breadcrumb";
import SearchBar from "./SearchBar";
import NodeGrid from "./NodeGrid";
import NodeCard from "./NodeCard";
import LoadingSkeleton from "./LoadingSkeleton";
import EssayModal from "./EssayModal";
import { motion, AnimatePresence } from "framer-motion";

export default function Explorer() {
  const {
    currentNode,
    currentPath,
    isLoading,
    setLoading,
    setChildren,
    navigateTo,
    goBack,
    setEssay,
    setEssayLoading,
  } = useHistorianStore();

  // Auto-split root on first load
  useEffect(() => {
    if (currentNode.id === "root" && currentNode.children.length === 0) {
      handleSplitTime(currentNode);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
          body: JSON.stringify({ action: "split-time", node }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const children: HistoryNode[] = data.phases.map(
          (phase: { title: string; start: string; end: string; summary: string }, i: number) => ({
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
    [setLoading, setChildren, navigateTo]
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
          body: JSON.stringify({ action: "split-geography", node }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);

        const children: HistoryNode[] = data.regions.map(
          (region: { regionName: string; summary: string }, i: number) => ({
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
    [setLoading, setChildren, navigateTo]
  );

  const handleDrillDown = useCallback(
    (node: HistoryNode) => {
      navigateTo(node.id);
    },
    [navigateTo]
  );

  const handleEssay = useCallback(
    async (node: HistoryNode) => {
      setEssayLoading(true);
      setEssay(null);
      // Navigate to the node so the essay modal shows the right title
      navigateTo(node.id);
      try {
        const res = await fetch("/api/explore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "essay", node }),
        });
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setEssay(data.essay);
      } catch (err) {
        console.error("Essay generation failed:", err);
        setEssay("Failed to generate essay. Please try again.");
      } finally {
        setEssayLoading(false);
      }
    },
    [setEssay, setEssayLoading, navigateTo]
  );

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") goBack();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goBack]);

  const showingChildren = currentNode.children.length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-parchment via-parchment to-amber-50/50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-parchment/90 backdrop-blur-md border-b border-sepia/10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4 mb-3">
            <h1 className="font-display text-2xl sm:text-3xl font-bold text-ink tracking-tight flex items-center gap-2">
              <span className="text-3xl">📚</span>
              <span className="bg-gradient-to-r from-ink to-sepia bg-clip-text text-transparent">
                Super Historian
              </span>
            </h1>
            <div className="hidden sm:block text-xs text-sepia/60 font-serif text-right">
              Depth: {currentNode.depth} | Nodes explored: {countNodes(useHistorianStore.getState().tree)}
            </div>
          </div>
          <SearchBar />
          <Breadcrumb />
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Current node hero card (when we're viewing a node) */}
          {currentPath.length > 1 && (
            <motion.div
              key={`hero-${currentNode.id}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <div className="bg-white/60 backdrop-blur border-2 border-sepia/20 rounded-2xl p-6 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-sepia/10 rounded-full text-xs font-mono text-ink/70">
                        {currentNode.timeRange.start}
                      </span>
                      <span className="text-ink/30 text-xs">→</span>
                      <span className="px-2.5 py-0.5 bg-sepia/10 rounded-full text-xs font-mono text-ink/70">
                        {currentNode.timeRange.end}
                      </span>
                      <span className="px-2.5 py-0.5 bg-crimson/10 text-crimson rounded-full text-xs font-mono">
                        📍 {currentNode.geographicScope}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl font-bold text-ink mb-2">
                      {currentNode.title}
                    </h2>
                    <p className="font-serif text-ink/80 leading-relaxed">
                      {currentNode.summary}
                    </p>
                  </div>
                </div>

                {/* Action buttons for current node */}
                <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-sepia/10">
                  <button
                    onClick={() => goBack()}
                    className="px-4 py-2 text-sm font-serif text-sepia border border-sepia/30 rounded-lg hover:bg-sepia/10 transition-colors flex items-center gap-1.5"
                  >
                    ← Back
                  </button>
                  <button
                    onClick={() => handleSplitTime(currentNode)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-serif bg-navy text-white rounded-lg hover:bg-navy/80 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    ⏳ Split by Time
                  </button>
                  <button
                    onClick={() => handleSplitGeo(currentNode)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-serif bg-crimson text-white rounded-lg hover:bg-crimson/80 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    🗺️ Split by Geography
                  </button>
                  <button
                    onClick={() => handleEssay(currentNode)}
                    disabled={isLoading}
                    className="px-4 py-2 text-sm font-serif bg-sepia text-parchment rounded-lg hover:bg-brass transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    📝 Write a 350-Word Essay
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Children grid */}
        {isLoading && !showingChildren && <LoadingSkeleton />}
        {showingChildren && (
          <NodeGrid
            nodes={currentNode.children}
            onSplitTime={handleSplitTime}
            onSplitGeo={handleSplitGeo}
            onDrillDown={handleDrillDown}
            onEssay={handleEssay}
            isLoading={isLoading}
            splitAxis={currentNode.splitAxis}
          />
        )}

        {/* Root node hero when no children yet */}
        {currentPath.length === 1 && !showingChildren && !isLoading && (
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
              {currentNode.title}
            </h2>
            <p className="font-serif text-ink/70 max-w-lg mb-8 text-lg leading-relaxed">
              {currentNode.summary}
            </p>
            <button
              onClick={() => handleSplitTime(currentNode)}
              className="px-8 py-4 bg-navy text-white font-display text-lg rounded-2xl hover:bg-navy/80 transition-all hover:scale-105 shadow-lg"
            >
              ⏳ Begin the Journey
            </button>
          </div>
        )}
      </main>

      {/* Essay Modal */}
      <EssayModal />

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
