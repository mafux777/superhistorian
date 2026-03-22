"use client";

import { useHistorianStore } from "@/lib/store";
import { motion } from "framer-motion";

interface ImagePlaceholderProps {
  contextText: string;
  cacheKey: string;
  compact?: boolean;
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

export default function ImagePlaceholder({ contextText, cacheKey, compact }: ImagePlaceholderProps) {
  const existingImage = useHistorianStore((s) => s.generatedImages[cacheKey]);
  const isGenerating = useHistorianStore((s) => s.generatingImages[cacheKey]);
  const error = useHistorianStore((s) => s.imageErrors[cacheKey]);

  if (existingImage) {
    return (
      <div className={`rounded-xl overflow-hidden border border-sepia/20 shadow-sm ${compact ? "my-4" : "my-3"}`}>
        <img
          src={existingImage}
          alt={`Historical illustration: ${contextText.slice(0, 80)}...`}
          className="w-full h-auto"
        />
      </div>
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
