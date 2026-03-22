import { HistoryNode } from "./types";

// Strip children and other bulky fields before sending a node to the API
export function slimNode(node: HistoryNode) {
  return {
    id: node.id,
    title: node.title,
    summary: node.summary,
    timeRange: node.timeRange,
    geographicScope: node.geographicScope,
    parentId: node.parentId,
    depth: node.depth,
    splitAxis: node.splitAxis,
    children: [],
  };
}
