# Super Historian — Implementation Plan

## Concept

An AI-driven interactive history explorer that presents all of human (and Earth) history as an infinitely zoomable, fractal timeline. The user navigates by recursively splitting any time period into ~5 sub-periods, or any region into ~5 sub-regions, with each split generated on-demand by an LLM via OpenRouter. The result is a lazily-generated tree that grows as the user explores.

---

## Core Data Model

### Node

Every box on screen is a **Node**. A node represents a slice of history defined by:

```ts
interface HistoryNode {
  id: string;                  // unique id (e.g. uuid)
  title: string;               // e.g. "The Renaissance"
  summary: string;             // 2-4 sentence paragraph from the LLM
  timeRange: {
    start: string;             // e.g. "4.5 billion years ago", "1914", "June 6 1944"
    end: string;
  };
  geographicScope: string;     // e.g. "Global", "Western Europe", "France"
  parentId: string | null;
  children: HistoryNode[];     // populated when user drills down
  splitAxis: "time" | "geography" | null; // how this node was split to produce children
  depth: number;
}
```

### Tree

The full exploration state is a **tree of nodes**. The root is always:

```
Title: "History of Earth"
Time:  4.5 billion years ago → present
Scope: Global
```

The tree starts with just this root. Children are appended lazily as the user clicks.

---

## User Interactions

### 1. Initial Load

- Display the root node as a single full-width box on a logarithmic timeline.
- Immediately fire an LLM call to split it into ~5 temporal phases.
- Render the 5 phases as boxes on the timeline (logarithmic scale so "Age of Dinosaurs" and "20th century" both get reasonable visual space).

### 2. "Go Deeper in Time"

- User clicks a phase (or clicks a "Split by Time" button on it).
- LLM splits that phase into ~5 sub-periods.
- UI zooms into that phase; the 5 sub-periods replace the current view.
- Breadcrumb trail at top shows the path: `Earth → Modern Era → 20th Century → …`

### 3. "Go Deeper in Geography"

- User clicks "Split by Geography" on any node.
- LLM splits the geographic scope into ~5 regions relevant to that time period.
- UI shows the ~5 regions as a grid/cards, each with a summary of what was happening there.
- Each region card can then be split further by time or geography.

### 4. Navigate Up / Sideways

- Breadcrumb trail allows jumping back to any ancestor.
- Sibling nodes remain visible/accessible so the user can explore a different branch.
- The tree is preserved in memory — revisiting a previously-explored node is instant (no re-fetch).

### 5. Jump to Topic (Search)

- Text input: user types e.g. "Second World War".
- LLM returns a single node: title, summary, time range, geographic scope.
- That node becomes a new subtree root. User can split it by time or geography from there.
- Optionally, the app grafts this node into the main tree at the correct position.

---

## LLM Integration (via OpenRouter)

### Provider

All LLM calls go through [OpenRouter](https://openrouter.ai/), which gives model flexibility (Claude, GPT-4, Llama, etc.) without vendor lock-in.

### Prompt Design

There are three core prompt templates:

#### A. Split by Time

```
You are a historian. Given the following historical period, divide it into
exactly 5 sequential sub-periods. For each, provide:
- title (short, evocative name)
- start and end dates
- summary (2-3 sentences)

Period: {title}
Time range: {start} to {end}
Geographic scope: {geographicScope}

Respond in JSON: { "phases": [{ "title", "start", "end", "summary" }] }
```

#### B. Split by Geography

```
You are a historian. Given the following historical period and region,
divide the geographic scope into exactly 5 meaningful sub-regions for
this era. For each, provide:
- regionName
- summary of what was happening there during this period (2-3 sentences)

Period: {title}
Time range: {start} to {end}
Current scope: {geographicScope}

Respond in JSON: { "regions": [{ "regionName", "summary" }] }
```

#### C. Jump to Topic

```
You are a historian. The user wants to explore: "{query}"

Provide:
- title
- start and end dates
- geographic scope (e.g. "Europe", "Global", "Japan")
- summary (3-4 sentences)

Respond in JSON: { "title", "start", "end", "geographicScope", "summary" }
```

All prompts request structured JSON output. The app validates the response shape before rendering.

### Prefetching / Prediction

To reduce perceived latency:

- **On hover or after render**: When the user views 5 sub-periods, speculatively fire LLM calls for the most likely next clicks (e.g., the most recent sub-period, since users tend to drill into recent history). Cache results.
- **Priority queue**: Prefetch the "most recent" child first, then others. Cancel prefetches if the user navigates away.
- **Cache layer**: All LLM responses are cached in a `Map<string, HistoryNode[]>` keyed by `(parentId, splitAxis)`. Revisiting a node is instant.

---

## Tech Stack

| Layer         | Choice           | Rationale |
|---------------|------------------|-----------|
| Framework     | **Next.js 14+** (App Router) | React-based, good for interactive SPAs, easy deployment on Vercel |
| Language      | **TypeScript**   | Type safety for the node tree and LLM response shapes |
| Styling       | **Tailwind CSS** | Rapid UI development, easy responsive design |
| State         | **Zustand**      | Lightweight store for the exploration tree + navigation state |
| LLM calls     | **OpenRouter REST API** | Single fetch call per interaction; called from a Next.js API route to keep the API key server-side |
| Animation     | **Framer Motion** | Smooth zoom/transition animations as the user drills in/out |
| Deployment    | **Vercel**       | Zero-config for Next.js |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  Browser (React / Next.js)                  │
│                                             │
│  ┌─────────┐  ┌──────────┐  ┌───────────┐  │
│  │Timeline │  │ Node     │  │ Search    │  │
│  │View     │  │ Detail   │  │ Bar       │  │
│  └────┬────┘  └────┬─────┘  └─────┬─────┘  │
│       │            │              │         │
│       └────────────┴──────────────┘         │
│                    │                        │
│              Zustand Store                  │
│         (tree, currentPath, cache)          │
└────────────────────┬────────────────────────┘
                     │ fetch("/api/explore")
                     ▼
┌────────────────────────────────────────────┐
│  Next.js API Route: /api/explore           │
│  - Receives: parentNode, splitAxis, query  │
│  - Builds prompt from template             │
│  - Calls OpenRouter API                    │
│  - Parses & validates JSON response        │
│  - Returns structured HistoryNode[]        │
└────────────────────┬───────────────────────┘
                     │
                     ▼
            OpenRouter API → LLM
```

---

## UI Layout

### Main View

```
┌──────────────────────────────────────────────────────────┐
│  🔍 [Search: "Jump to a topic..."]                       │
├──────────────────────────────────────────────────────────┤
│  Breadcrumb: Earth > Modern Era > 20th Century           │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│  │1900- │ │1914- │ │1918- │ │1939- │ │1945- │          │
│  │1914  │ │1918  │ │1939  │ │1945  │ │2000  │          │
│  │      │ │      │ │      │ │      │ │      │          │
│  │Belle │ │World │ │Inter-│ │World │ │Cold  │          │
│  │Epoq. │ │War I │ │war   │ │War II│ │War   │          │
│  │      │ │      │ │Period│ │      │ │Era   │          │
│  │[Time]│ │[Time]│ │[Time]│ │[Time]│ │[Time]│          │
│  │[Geo] │ │[Geo] │ │[Geo] │ │[Geo] │ │[Geo] │          │
│  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                          │
│  ← Back to parent                                        │
└──────────────────────────────────────────────────────────┘
```

Each box shows:
- Time range
- Title
- 2-3 sentence summary
- Two buttons: **Split by Time** | **Split by Geography**

When splitting by geography, the same layout works but boxes represent regions instead of time periods.

### Logarithmic Scale (Root Level)

At the top level, a logarithmic timeline is used so that:
- 4.5B–500M years ago → "Formation & Early Life"
- 500M–65M → "Age of Complex Life"
- 65M–2M → "Age of Mammals"
- 2M–10,000 BC → "Human Evolution"
- 10,000 BC–Present → "Civilization"

This prevents "Civilization" from being an invisible sliver. The logarithmic scale is only needed for the visual representation at the widest zoom levels; deeper nodes use linear or contextually appropriate scales.

---

## Implementation Phases

### Phase 1: Skeleton (MVP)
- [ ] Next.js project setup with TypeScript + Tailwind
- [ ] Data model: `HistoryNode` type definition
- [ ] Zustand store: tree state, current path, cache
- [ ] API route `/api/explore` with OpenRouter integration
- [ ] Three prompt templates (time split, geo split, topic jump)
- [ ] Basic UI: render 5 boxes, click to drill down, breadcrumb to go back
- [ ] Hardcoded root node, first LLM-generated split on load

**Goal**: Click through history, going deeper each time. Ugly but functional.

### Phase 2: Polish
- [ ] Logarithmic timeline visualization for the root level
- [ ] Framer Motion transitions (zoom in/out animations)
- [ ] Search bar with "Jump to topic" functionality
- [ ] Loading states and skeleton UI while LLM responds
- [ ] Error handling and retry logic for LLM calls
- [ ] Responsive design (mobile-friendly cards)

### Phase 3: Performance & UX
- [ ] Prefetching: speculative LLM calls on hover / after render
- [ ] Persistent cache (localStorage or IndexedDB) so the tree survives page refresh
- [ ] "Share this view" — encode the current path as a URL
- [ ] Visual indicator of which nodes have already been explored
- [ ] Keyboard navigation (arrow keys to move between siblings, Enter to drill in, Escape to go back)

### Phase 4: Stretch Goals
- [ ] Multiple LLM model selector (let user pick via OpenRouter)
- [ ] "Explain connection" — select two nodes and ask the LLM how they relate
- [ ] Export the explored tree as a mind map or outline
- [ ] Collaborative mode — multiple users exploring the same tree in real time
- [ ] Multimedia: LLM suggests relevant Wikipedia images or maps for each node

---

## Key Design Decisions

### Why ~5 splits, not more or fewer?
Five is a sweet spot: enough to be informative, few enough to fit on screen without scrolling. The LLM can judge contextually — some periods naturally split into 4 or 6, which is fine. The prompt says "exactly 5" for consistency but this could be relaxed.

### Why OpenRouter instead of a direct API?
OpenRouter provides a single API interface to many models. This lets users (or the app) choose the best model for cost/quality tradeoff. A fast cheap model for prefetching, a better model for the node the user actually clicked.

### Why server-side API route?
The OpenRouter API key must stay secret. The Next.js API route acts as a thin proxy, keeping the key on the server. It also lets us add rate limiting, caching, or logging later.

### Why Zustand over Redux or Context?
The state shape is simple (a tree + a pointer to the current node). Zustand is minimal, has no boilerplate, and handles this well. No need for Redux's ceremony.

### How to handle LLM hallucination / inconsistency?
History is the ideal domain for LLM-generated content because:
- Minor inaccuracies in summaries are acceptable for an exploratory tool (this is not an encyclopedia).
- The structure (split into sub-periods) is more important than the exact content.
- The user can always drill deeper to get more specificity.

That said, the system prompt should instruct the LLM to be factual and acknowledge uncertainty where appropriate.

---

## File Structure (Projected)

```
superhistorian/
├── app/
│   ├── layout.tsx              # Root layout with font, metadata
│   ├── page.tsx                # Main page — renders the explorer
│   └── api/
│       └── explore/
│           └── route.ts        # API route: LLM proxy via OpenRouter
├── components/
│   ├── Timeline.tsx            # Logarithmic timeline (root level)
│   ├── NodeCard.tsx            # Single history node box
│   ├── NodeGrid.tsx            # Grid of 5 node cards
│   ├── Breadcrumb.tsx          # Navigation breadcrumb trail
│   ├── SearchBar.tsx           # Jump-to-topic input
│   └── LoadingSkeleton.tsx     # Placeholder while LLM responds
├── lib/
│   ├── types.ts                # HistoryNode and related types
│   ├── store.ts                # Zustand store
│   ├── prompts.ts              # Prompt templates
│   └── openrouter.ts           # OpenRouter API client
├── PLAN.md                     # This file
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## Estimated Complexity

This is a **medium-complexity** frontend project with a simple backend (one API route). The hardest parts are:

1. **Prompt engineering** — getting the LLM to return consistent, well-structured JSON with historically sensible splits. This will require iteration.
2. **Tree navigation UX** — making it feel intuitive to drill in, go back, and explore sideways. Animations and breadcrumbs are key.
3. **Latency management** — LLM calls take 1-5 seconds. Prefetching and good loading states are essential to keep the experience smooth.

The core MVP (Phase 1) is straightforward and could be built quickly. The concept is sound and the recursive structure keeps the codebase simple — the same component and the same API call are reused at every level of depth.
