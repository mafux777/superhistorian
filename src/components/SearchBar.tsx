"use client";

import { useState } from "react";
import { useHistorianStore } from "@/lib/store";
import { HistoryNode } from "@/lib/types";
import { v4 } from "@/lib/uuid";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const { setChildren, navigateTo, tree } = useHistorianStore();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const res = await fetch("/api/explore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "jump-to-topic", query: query.trim() }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Create a new node and add it as a child of root
      const newNode: HistoryNode = {
        id: v4(),
        title: data.title,
        summary: data.summary,
        timeRange: { start: data.start, end: data.end },
        geographicScope: data.geographicScope,
        parentId: "root",
        children: [],
        splitAxis: null,
        depth: 1,
      };

      // Add to root's children
      const existingChildren = tree.children;
      setChildren("root", [...existingChildren, newNode], tree.splitAxis || "time");
      navigateTo(newNode.id);
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
