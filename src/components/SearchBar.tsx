"use client";

import { useState } from "react";
import { useHistorianStore } from "@/lib/store";
import { HistoryNode } from "@/lib/types";
import { v4 } from "@/lib/uuid";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { setTree, addDebugEntry } = useHistorianStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "jump-to-topic", query: query.trim(), model: useHistorianStore.getState().selectedModel, language: useHistorianStore.getState().selectedLanguage }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      if (data._debug) {
        addDebugEntry({ action: "jump-to-topic", model: data._debug.model, prompt: data._debug.prompt, response: data });
      }

      // Create a new root node from the search result
      const newRoot: HistoryNode = {
        id: v4(),
        title: data.title,
        summary: data.summary,
        timeRange: { start: data.start, end: data.end },
        geographicScope: data.geographicScope,
        parentId: null,
        children: [],
        splitAxis: null,
        depth: 0,
      };

      // Replace the tree with this new root
      setTree(newRoot);
      setQuery("");
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <form onSubmit={handleSearch} className="relative">
      <div className="flex items-center bg-white/80 backdrop-blur border-2 border-sepia/20 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow focus-within:border-sepia/50 focus-within:shadow-md">
        <span className="pl-4 text-sepia/60 text-lg">&#x1F50D;</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Jump to a topic... (e.g. "Roman Empire", "Silk Road")'
          className="w-full px-3 py-3 bg-transparent outline-none text-ink font-serif placeholder:text-sepia/40 text-sm sm:text-base"
        />
        <button
          type="submit"
          disabled={!query.trim() || isSearching}
          className="px-5 py-3 bg-sepia text-parchment font-serif font-semibold text-sm hover:bg-brass transition-colors disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isSearching ? "Searching..." : "Explore"}
        </button>
      </div>
    </form>
  );
}
