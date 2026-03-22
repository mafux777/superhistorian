"use client";

import { useState, useEffect } from "react";
import { HistoryNode } from "@/lib/types";
import { useHistorianStore } from "@/lib/store";
import { generateImage } from "./ImagePlaceholder";
import ImageLightbox from "./ImageLightbox";
import { motion } from "framer-motion";

interface NodeCardProps {
  node: HistoryNode;
  index: number;
  onSplitTime: (node: HistoryNode) => void;
  onSplitGeo: (node: HistoryNode) => void;
  onDrillDown: (node: HistoryNode) => void;
  onEssay: (node: HistoryNode) => void;
  isLoading: boolean;
  isSelected?: boolean;
}

const CARD_COLORS = [
  "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400",
  "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400",
  "from-sky-50 to-blue-50 border-sky-200 hover:border-sky-400",
  "from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400",
  "from-rose-50 to-pink-50 border-rose-200 hover:border-rose-400",
];

const SELECTED_COLORS = [
  "from-amber-100 to-orange-100 border-amber-500",
  "from-emerald-100 to-teal-100 border-emerald-500",
  "from-sky-100 to-blue-100 border-sky-500",
  "from-violet-100 to-purple-100 border-violet-500",
  "from-rose-100 to-pink-100 border-rose-500",
];

export default function NodeCard({ node, index, onSplitTime, onSplitGeo, onDrillDown, onEssay, isLoading, isSelected }: NodeCardProps) {
  const colorClass = isSelected
    ? SELECTED_COLORS[index % SELECTED_COLORS.length]
    : CARD_COLORS[index % CARD_COLORS.length];

  // Prefetch status
  const turboMode = useHistorianStore((s) => s.turboMode);
  const prefetched = useHistorianStore((s) => s.prefetchedSplits[node.id]);
  const prefetching = useHistorianStore((s) => s.prefetchingNodes[node.id]);
  const isCancelled = useHistorianStore((s) => s.cancelledNodes[node.id]);

  // Image state
  const existingImage = useHistorianStore((s) => s.generatedImages[`node-${node.id}`]);
  const isGeneratingImage = useHistorianStore((s) => s.generatingImages[`node-${node.id}`]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Tick for elapsed time
  const [, setTick] = useState(0);
  useEffect(() => {
    if (!turboMode) return;
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, [turboMode]);

  const elapsedSec = prefetching?.startedAt
    ? Math.floor((Date.now() - prefetching.startedAt) / 1000)
    : 0;

  let prefetchStatus: "none" | "queued" | "working" | "partial" | "ready" | "cancelled" = "none";
  if (turboMode) {
    const timeDone = !!prefetched?.time;
    const geoDone = !!prefetched?.geo;
    const timeWorking = !!prefetching?.time;
    const geoWorking = !!prefetching?.geo;
    if (isCancelled && !timeDone && !geoDone) prefetchStatus = "cancelled";
    else if (timeDone && geoDone) prefetchStatus = "ready";
    else if (timeDone || geoDone) prefetchStatus = "partial";
    else if (timeWorking || geoWorking) prefetchStatus = "working";
    else prefetchStatus = "queued";
  }

  const imageContext = `${node.title}. ${node.timeRange.start} to ${node.timeRange.end}, ${node.geographicScope}. ${node.summary}`;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: index * 0.06, type: "spring", stiffness: 200, damping: 20 }}
        whileHover={{ y: -3, transition: { duration: 0.15 } }}
        className={`bg-gradient-to-br ${colorClass} border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-md group relative ${
          isSelected ? "ring-2 ring-ink/20 shadow-md" : ""
        }`}
        onClick={() => onDrillDown(node)}
      >
        {/* Prefetch badge */}
        {prefetchStatus !== "none" && (
          <div className="absolute top-2 right-2">
            {prefetchStatus === "ready" && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-700 rounded-full text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> ready
              </span>
            )}
            {prefetchStatus === "partial" && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-500/20 text-amber-700 rounded-full text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> partial
              </span>
            )}
            {prefetchStatus === "working" && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-700 rounded-full text-[10px] font-mono font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" /> {elapsedSec}s
              </span>
            )}
            {prefetchStatus === "cancelled" && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-500/15 text-red-600 rounded-full text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> cancelled
              </span>
            )}
            {prefetchStatus === "queued" && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 bg-ink/10 text-ink/50 rounded-full text-[10px] font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-ink/30" /> queued
              </span>
            )}
          </div>
        )}

        {/* Time range */}
        <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
          <span className="px-2 py-0.5 bg-white/60 rounded-full text-[11px] font-mono text-ink/60">
            {node.timeRange.start}
          </span>
          <span className="text-ink/20 text-[10px]">&rarr;</span>
          <span className="px-2 py-0.5 bg-white/60 rounded-full text-[11px] font-mono text-ink/60">
            {node.timeRange.end}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-display text-base font-bold text-ink leading-snug mb-1 pr-16">
          {node.title}
        </h3>

        {/* Scope */}
        <div className="text-[11px] text-sepia/60 font-serif mb-1">
          📍 {node.geographicScope}
        </div>

        {/* Summary */}
        <p className="text-xs text-ink/60 font-serif leading-relaxed line-clamp-3 mb-3">
          {node.summary}
        </p>

        {/* Image thumbnail (if generated) */}
        {existingImage && (
          <div
            className="rounded-lg overflow-hidden border border-sepia/15 mb-3 cursor-zoom-in"
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
          >
            <img src={existingImage} alt={node.title} className="w-full h-auto" />
          </div>
        )}

        {/* 2x2 action button grid */}
        <div className="grid grid-cols-2 gap-1.5 mt-auto">
          <button
            onClick={(e) => { e.stopPropagation(); onSplitTime(node); }}
            disabled={isLoading}
            className="px-2 py-1.5 bg-navy text-white text-[11px] font-semibold rounded-lg hover:bg-navy/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-1 shadow-sm"
          >
            ⏳ Time
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onSplitGeo(node); }}
            disabled={isLoading}
            className="px-2 py-1.5 bg-crimson text-white text-[11px] font-semibold rounded-lg hover:bg-crimson/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-1 shadow-sm"
          >
            🗺️ Geo
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              generateImage(`node-${node.id}`, imageContext);
            }}
            disabled={isLoading || isGeneratingImage || !!existingImage}
            className="px-2 py-1.5 bg-violet-600 text-white text-[11px] font-semibold rounded-lg hover:bg-violet-500 transition-colors disabled:opacity-40 flex items-center justify-center gap-1 shadow-sm"
          >
            {isGeneratingImage ? "🎨 ..." : existingImage ? "🎨 Done" : "🎨 Image"}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onEssay(node); }}
            disabled={isLoading}
            className="px-2 py-1.5 bg-sepia text-parchment text-[11px] font-semibold rounded-lg hover:bg-brass transition-colors disabled:opacity-40 flex items-center justify-center gap-1 shadow-sm"
          >
            📝 Essay
          </button>
        </div>
      </motion.div>

      {/* Lightbox for image */}
      <ImageLightbox
        imageUrl={lightboxOpen ? existingImage || null : null}
        title={node.title}
        timeRange={node.timeRange}
        geographicScope={node.geographicScope}
        summary={node.summary}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
