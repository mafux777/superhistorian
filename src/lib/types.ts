export interface HistoryNode {
  id: string;
  title: string;
  summary: string;
  timeRange: {
    start: string;
    end: string;
  };
  geographicScope: string;
  parentId: string | null;
  children: HistoryNode[];
  splitAxis: "time" | "geography" | null;
  depth: number;
}

export interface SplitByTimeResponse {
  phases: {
    title: string;
    start: string;
    end: string;
    summary: string;
  }[];
}

export interface SplitByGeoResponse {
  regions: {
    regionName: string;
    summary: string;
  }[];
}

export interface JumpToTopicResponse {
  title: string;
  start: string;
  end: string;
  geographicScope: string;
  summary: string;
}

export interface EssayResponse {
  essay: string;
}

export type ExploreRequest = {
  action: "split-time" | "split-geography" | "jump-to-topic" | "essay";
  node?: HistoryNode;
  query?: string;
};
