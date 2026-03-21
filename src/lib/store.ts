"use client";

import { create } from "zustand";
import { HistoryNode } from "./types";

interface HistorianState {
  // The entire exploration tree
  tree: HistoryNode;
  // Path from root to currently viewed node (array of IDs)
  currentPath: string[];
  // Currently selected node
  currentNode: HistoryNode;
  // Loading state
  isLoading: boolean;
  // Essay state
  essay: string | null;
  isEssayLoading: boolean;
  // Search state
  searchNode: HistoryNode | null;

  // Actions
  setChildren: (nodeId: string, children: HistoryNode[], splitAxis: "time" | "geography") => void;
  navigateTo: (nodeId: string) => void;
  navigateToPath: (path: string[]) => void;
  goBack: () => void;
  setLoading: (loading: boolean) => void;
  setEssay: (essay: string | null) => void;
  setEssayLoading: (loading: boolean) => void;
  setSearchNode: (node: HistoryNode | null) => void;
  findNode: (nodeId: string) => HistoryNode | null;
}

const ROOT_NODE: HistoryNode = {
  id: "root",
  title: "History of Earth",
  summary:
    "From a molten ball of rock to a pale blue dot teeming with life and civilization — 4.5 billion years of drama, evolution, and human ambition.",
  timeRange: { start: "4.5 billion years ago", end: "Present" },
  geographicScope: "Global",
  parentId: null,
  children: [],
  splitAxis: null,
  depth: 0,
};

function findNodeInTree(node: HistoryNode, id: string): HistoryNode | null {
  if (node.id === id) return node;
  for (const child of node.children) {
    const found = findNodeInTree(child, id);
    if (found) return found;
  }
  return null;
}

function findPathToNode(node: HistoryNode, id: string, path: string[] = []): string[] | null {
  const newPath = [...path, node.id];
  if (node.id === id) return newPath;
  for (const child of node.children) {
    const found = findPathToNode(child, id, newPath);
    if (found) return found;
  }
  return null;
}

function updateNodeInTree(tree: HistoryNode, nodeId: string, updater: (n: HistoryNode) => HistoryNode): HistoryNode {
  if (tree.id === nodeId) return updater(tree);
  return {
    ...tree,
    children: tree.children.map((child) => updateNodeInTree(child, nodeId, updater)),
  };
}

export const useHistorianStore = create<HistorianState>((set, get) => ({
  tree: ROOT_NODE,
  currentPath: ["root"],
  currentNode: ROOT_NODE,
  isLoading: false,
  essay: null,
  isEssayLoading: false,
  searchNode: null,

  setChildren: (nodeId, children, splitAxis) => {
    set((state) => {
      const newTree = updateNodeInTree(state.tree, nodeId, (n) => ({
        ...n,
        children,
        splitAxis,
      }));
      const currentNode = findNodeInTree(newTree, state.currentNode.id) || newTree;
      return { tree: newTree, currentNode };
    });
  },

  navigateTo: (nodeId) => {
    const state = get();
    const node = findNodeInTree(state.tree, nodeId);
    if (!node) return;
    const path = findPathToNode(state.tree, nodeId);
    if (!path) return;
    set({ currentNode: node, currentPath: path, essay: null });
  },

  navigateToPath: (path) => {
    const state = get();
    const nodeId = path[path.length - 1];
    const node = findNodeInTree(state.tree, nodeId);
    if (!node) return;
    set({ currentNode: node, currentPath: path, essay: null });
  },

  goBack: () => {
    const state = get();
    if (state.currentPath.length <= 1) return;
    const parentPath = state.currentPath.slice(0, -1);
    const parentId = parentPath[parentPath.length - 1];
    const parent = findNodeInTree(state.tree, parentId);
    if (parent) {
      set({ currentNode: parent, currentPath: parentPath, essay: null });
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setEssay: (essay) => set({ essay }),
  setEssayLoading: (isEssayLoading) => set({ isEssayLoading }),
  setSearchNode: (searchNode) => set({ searchNode }),

  findNode: (nodeId) => {
    return findNodeInTree(get().tree, nodeId);
  },
}));
