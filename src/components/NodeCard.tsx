"use client";

import { HistoryNode } from "@/lib/types";
import { motion } from "framer-motion";

interface NodeCardProps {
  node: HistoryNode;
  index: number;
  onSplitTime: (node: HistoryNode) => void;
  onSplitGeo: (node: HistoryNode) => void;
  onDrillDown: (node: HistoryNode) => void;
  onEssay: (node: HistoryNode) => void;
  isLoading: boolean;
}

const CARD_COLORS = [
  "from-amber-50 to-orange-50 border-amber-200 hover:border-amber-400",
  "from-emerald-50 to-teal-50 border-emerald-200 hover:border-emerald-400",
  "from-sky-50 to-blue-50 border-sky-200 hover:border-sky-400",
  "from-violet-50 to-purple-50 border-violet-200 hover:border-violet-400",
  "from-rose-50 to-pink-50 border-rose-200 hover:border-rose-400",
];

const DEPTH_ICONS = ["🌍", "🏛️", "⚔️", "📜", "🔬", "🎭", "👑", "🗺️", "📖", "🏰", "⭐", "🔥", "💎", "🌿", "🎨"];

export default function NodeCard({ node, index, onSplitTime, onSplitGeo, onDrillDown, onEssay, isLoading }: NodeCardProps) {
  const colorClass = CARD_COLORS[index % CARD_COLORS.length];
  const icon = DEPTH_ICONS[node.depth % DEPTH_ICONS.length];
  const hasChildren = node.children.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, type: "spring", stiffness: 200, damping: 20 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`bg-gradient-to-br ${colorClass} border-2 rounded-2xl p-5 flex flex-col gap-3 cursor-pointer transition-all duration-200 shadow-sm hover:shadow-lg group relative overflow-hidden`}
      onClick={() => hasChildren ? onDrillDown(node) : undefined}
    >
      {/* Depth indicator */}
      <div className="absolute top-2 right-3 text-2xl opacity-20 group-hover:opacity-40 transition-opacity">
        {icon}
      </div>

      {/* Time range badge */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-block px-2.5 py-0.5 bg-white/70 rounded-full text-xs font-mono text-ink/70 border border-black/5">
          {node.timeRange.start}
        </span>
        <span className="text-ink/30 text-xs">→</span>
        <span className="inline-block px-2.5 py-0.5 bg-white/70 rounded-full text-xs font-mono text-ink/70 border border-black/5">
          {node.timeRange.end}
        </span>
      </div>

      {/* Title */}
      <h3 className="font-display text-lg font-bold text-ink leading-tight">
        {node.title}
      </h3>

      {/* Geographic scope */}
      <div className="text-xs text-sepia font-serif flex items-center gap-1">
        <span>📍</span> {node.geographicScope}
        <span className="ml-auto text-ink/30">Depth {node.depth}</span>
      </div>

      {/* Summary */}
      <p className="text-sm text-ink/80 font-serif leading-relaxed line-clamp-4">
        {node.summary}
      </p>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2 mt-auto pt-2">
        <button
          onClick={(e) => { e.stopPropagation(); onSplitTime(node); }}
          disabled={isLoading}
          className="flex-1 min-w-[100px] px-3 py-2 bg-navy text-white text-xs font-semibold rounded-lg hover:bg-navy/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>⏳</span> Split by Time
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onSplitGeo(node); }}
          disabled={isLoading}
          className="flex-1 min-w-[100px] px-3 py-2 bg-crimson text-white text-xs font-semibold rounded-lg hover:bg-crimson/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>🗺️</span> Split by Geo
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onEssay(node); }}
          disabled={isLoading}
          className="flex-1 min-w-[100px] px-3 py-2 bg-sepia text-parchment text-xs font-semibold rounded-lg hover:bg-brass transition-colors disabled:opacity-40 flex items-center justify-center gap-1.5 shadow-sm"
        >
          <span>📝</span> 350-Word Essay
        </button>
      </div>

      {/* Drill-down indicator for nodes with children */}
      {hasChildren && (
        <div className="text-center text-xs text-sepia/60 font-serif italic pt-1">
          Click to explore {node.children.length} sub-{node.splitAxis === "geography" ? "regions" : "periods"} &rarr;
        </div>
      )}
    </motion.div>
  );
}
