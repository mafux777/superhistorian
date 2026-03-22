"use client";

import { HistoryNode } from "@/lib/types";
import NodeCard from "./NodeCard";
import { generateImage } from "./ImagePlaceholder";
import { useHistorianStore } from "@/lib/store";
import { motion, AnimatePresence } from "framer-motion";

interface NodeGridProps {
  nodes: HistoryNode[];
  onSplitTime: (node: HistoryNode) => void;
  onSplitGeo: (node: HistoryNode) => void;
  onDrillDown: (node: HistoryNode) => void;
  onEssay: (node: HistoryNode) => void;
  isLoading: boolean;
  splitAxis: "time" | "geography" | null;
  selectedChildId?: string | null;
}

export default function NodeGrid({ nodes, onSplitTime, onSplitGeo, onDrillDown, onEssay, isLoading, splitAxis, selectedChildId }: NodeGridProps) {
  const generatedImages = useHistorianStore((s) => s.generatedImages);
  const generatingImages = useHistorianStore((s) => s.generatingImages);

  if (nodes.length === 0) return null;

  const allHaveImages = nodes.every((n) => generatedImages[`node-${n.id}`]);
  const anyGenerating = nodes.some((n) => generatingImages[`node-${n.id}`]);

  const handleGenerateAll = () => {
    for (const node of nodes) {
      const key = `node-${node.id}`;
      const context = `${node.title}. ${node.timeRange.start} to ${node.timeRange.end}, ${node.geographicScope}. ${node.summary}`;
      generateImage(key, context);
    }
  };

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
        {!allHaveImages && (
          <button
            onClick={handleGenerateAll}
            disabled={anyGenerating}
            className="px-3 py-1.5 text-xs font-serif text-sepia border border-sepia/30 rounded-lg hover:bg-sepia/10 transition-colors disabled:opacity-40 flex items-center gap-1.5"
          >
            <span>🎨</span> {anyGenerating ? "Generating..." : "Generate All Images"}
          </button>
        )}
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
              isSelected={node.id === selectedChildId}
            />
          ))}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
