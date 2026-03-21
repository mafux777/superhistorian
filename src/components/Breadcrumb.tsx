"use client";

import { useHistorianStore } from "@/lib/store";
import { motion } from "framer-motion";

export default function Breadcrumb() {
  const { currentPath, tree, navigateToPath } = useHistorianStore();

  // Build breadcrumb items from path
  const items: { id: string; title: string; path: string[] }[] = [];
  let node = tree;
  for (let i = 0; i < currentPath.length; i++) {
    const id = currentPath[i];
    if (i === 0) {
      items.push({ id: node.id, title: node.title, path: currentPath.slice(0, i + 1) });
    } else {
      const child = node.children.find((c) => c.id === id);
      if (child) {
        items.push({ id: child.id, title: child.title, path: currentPath.slice(0, i + 1) });
        node = child;
      }
    }
  }

  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap px-1 py-2">
      {items.map((item, i) => (
        <motion.span
          key={item.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.05 }}
          className="flex items-center gap-1"
        >
          {i > 0 && <span className="text-sepia/50 mx-1">&rsaquo;</span>}
          {i < items.length - 1 ? (
            <button
              onClick={() => navigateToPath(item.path)}
              className="text-sepia hover:text-brass hover:underline underline-offset-2 transition-colors font-serif truncate max-w-[120px] sm:max-w-[200px]"
              title={item.title}
            >
              {item.title}
            </button>
          ) : (
            <span className="text-ink font-semibold font-serif truncate max-w-[150px] sm:max-w-[250px]" title={item.title}>
              {item.title}
            </span>
          )}
        </motion.span>
      ))}
    </nav>
  );
}
