"use client";

import { useState } from "react";
import { useHistorianStore } from "@/lib/store";
import { motion } from "framer-motion";
import ImageLightbox from "./ImageLightbox";

interface ImagePlaceholderProps {
  contextText: string;
  cacheKey: string;
  compact?: boolean;
  title?: string;
  timeRange?: { start: string; end: string };
  geographicScope?: string;
  summary?: string;
}

// Fire-and-forget image generation that writes results to the store
export function generateImage(cacheKey: string, contextText: string) {
  const store = useHistorianStore.getState();

  // Don't start if already generating or already have an image
  if (store.generatingImages[cacheKey] || store.generatedImages[cacheKey]) return;

  store.setGeneratingImage(cacheKey, true);

  fetch("/api/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: contextText,
      model: store.selectedImageModel,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data._debug) {
        useHistorianStore.getState().addDebugEntry({
          action: "generate-image",
          model: data._debug.model,
          prompt: data._debug.prompt,
          response: data,
        });
      }
      if (data.error) throw new Error(data.error);
      useHistorianStore.getState().setGeneratedImage(cacheKey, data.imageUrl);
    })
    .catch((err) => {
      useHistorianStore.getState().setImageError(
        cacheKey,
        err instanceof Error ? err.message : "Failed to generate image"
      );
    });
}

export default function ImagePlaceholder({ contextText, cacheKey, compact, title, timeRange, geographicScope, summary }: ImagePlaceholderProps) {
  const existingImage = useHistorianStore((s) => s.generatedImages[cacheKey]);
  const isGenerating = useHistorianStore((s) => s.generatingImages[cacheKey]);
  const error = useHistorianStore((s) => s.imageErrors[cacheKey]);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (existingImage) {
    return (
      <>
        <div
          className={`rounded-xl overflow-hidden border border-sepia/20 shadow-sm cursor-pointer hover:shadow-md transition-shadow ${compact ? "my-4" : "my-3"}`}
          onClick={(e) => { e.stopPropagation(); setLightboxOpen(true); }}
        >
          <img
            src={existingImage}
            alt={title || `Historical illustration: ${contextText.slice(0, 80)}...`}
            className="w-full h-auto"
          />
        </div>
        <ImageLightbox
          imageUrl={lightboxOpen ? existingImage : null}
          title={title}
          timeRange={timeRange}
          geographicScope={geographicScope}
          summary={summary}
          onClose={() => setLightboxOpen(false)}
        />
      </>
    );
  }

  return (
    <div
      className={`rounded-xl border-2 border-dashed border-sepia/20 bg-sepia/5 flex flex-col items-center justify-center gap-2 transition-colors hover:border-sepia/40 hover:bg-sepia/10 ${
        compact ? "my-4 py-6" : "my-3 py-8"
      }`}
    >
      {isGenerating ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="text-2xl"
          >
            🎨
          </motion.div>
          <span className="text-xs font-serif text-sepia/60 italic">Painting the scene...</span>
        </>
      ) : error ? (
        <>
          <span className="text-xs text-crimson font-serif">{error}</span>
          <button
            onClick={() => generateImage(cacheKey, contextText)}
            className="px-3 py-1.5 text-xs font-serif bg-sepia/10 text-sepia rounded-lg hover:bg-sepia/20 transition-colors"
          >
            Retry
          </button>
        </>
      ) : (
        <button
          onClick={() => generateImage(cacheKey, contextText)}
          className="flex items-center gap-2 px-4 py-2 text-xs font-serif text-sepia border border-sepia/30 rounded-lg hover:bg-sepia/10 transition-colors"
        >
          <span>🎨</span> Generate Illustration
        </button>
      )}
    </div>
  );
}
