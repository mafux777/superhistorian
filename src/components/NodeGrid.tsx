"use client";

import { HistoryNode } from "@/lib/types";
import NodeCard from "./NodeCard";
import { motion, AnimatePresence } from "framer-motion";

interface NodeGridProps {
  nodes: HistoryNode[];
  onSplitTime: (node: HistoryNode) => void;
  onSplitGeo: (node: HistoryNode) => void;
  onDrillDown: (node: HistoryNode) => void;
  onEssay: (node: HistoryNode) => void;
  isLoading: boolean;
  splitAxis: "time" | "geography" | null;
}

export default function NodeGrid({ nodes, onSplitTime, onSplitGeo, onDrillDown, onEssay, isLoading, splitAxis }: NodeGridProps) {
  if (nodes.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex items-center gap-3 px-1"
      >
        <span className="text-xl">
          {splitAxis === "geography" ? "🗺️" : "⏳"}
        </span>
        <h2 className="font-display text-lg text-ink/70">
          {splitAxis === "geography"
            ? `${nodes.length} Regions to Explore`
            : `${nodes.length} Periods in Sequence`}
        </h2>
        <div className="flex-1 h-px bg-sepia/20" />
      </motion.div>

      {/* Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={nodes.map((n) => n.id).join(",")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
        >
          {nodes.map((node, i) => (
            <NodeCard
              key={node.id}
              node={node}
              index={i}
              onSplitTime={onSplitTime}
              onSplitGeo={onSplitGeo}
              onDrillDown={onDrillDown}
              onEssay={onEssay}
              isLoading={isLoading}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
