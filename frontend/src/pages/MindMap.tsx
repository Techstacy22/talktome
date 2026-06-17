import { useCallback, useEffect, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  Edge,
  MiniMap,
  Node,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import api from "../lib/api";

/* ── types ────────────────────────────────────────────────────────── */

interface RawNode {
  id: string;
  label: string;
  category: string;
  weight: number;
  created_at: string;
}

interface RawEdge {
  id: string;
  source_node_id: string;
  target_node_id: string;
  relationship_label: string | null;
  weight: number;
}

interface MapData {
  map_id: string;
  nodes: RawNode[];
  edges: RawEdge[];
  updated_at: string;
}

interface JournalItem {
  id: string;
  title: string;
}

interface ChatItem {
  id: string;
  title: string | null;
}

/* ── category colours ─────────────────────────────────────────────── */

const CAT: Record<string, { bg: string; border: string; text: string; dot: string }> = {
  goal:      { bg: "#f3e8ff", border: "#a855f7", text: "#7c3aed", dot: "bg-purple-400" },
  challenge: { bg: "#fef9c3", border: "#eab308", text: "#854d0e", dot: "bg-yellow-400" },
  interest:  { bg: "#dcfce7", border: "#22c55e", text: "#15803d", dot: "bg-green-400" },
  person:    { bg: "#dbeafe", border: "#3b82f6", text: "#1d4ed8", dot: "bg-blue-400" },
  topic:     { bg: "#e0e7ff", border: "#6366f1", text: "#4338ca", dot: "bg-indigo-400" },
  emotion:   { bg: "#fce7f3", border: "#ec4899", text: "#9d174d", dot: "bg-pink-400" },
  skill:     { bg: "#ccfbf1", border: "#14b8a6", text: "#0f766e", dot: "bg-teal-400" },
};

const ALL_CATEGORIES = Object.keys(CAT);

/* ── layout: phyllotaxis spiral ───────────────────────────────────── */

function spiralPos(i: number, total: number) {
  if (total === 1) return { x: 500, y: 300 };
  const angle = i * 2.3999632; // golden angle ≈ 137.5°
  const r = 90 * Math.sqrt(i + 1);
  return { x: 500 + r * Math.cos(angle), y: 330 + r * Math.sin(angle) };
}

/* ── convert backend → React Flow ────────────────────────────────── */

function toFlowNodes(rawNodes: RawNode[], visible: Set<string>): Node[] {
  const filtered = rawNodes.filter((n) => visible.has(n.category));
  return filtered.map((n, i) => {
    const colors = CAT[n.category] ?? CAT.topic;
    const size = Math.min(16, 11 + n.weight);
    return {
      id: n.id,
      data: { label: n.label, category: n.category, weight: n.weight },
      position: spiralPos(i, filtered.length),
      style: {
        background: colors.bg,
        border: `2px solid ${colors.border}`,
        color: colors.text,
        borderRadius: 10,
        padding: "6px 14px",
        fontSize: size,
        fontWeight: 600,
        boxShadow: "0 1px 4px rgba(0,0,0,.08)",
        minWidth: 80,
        textAlign: "center" as const,
      },
    };
  });
}

function toFlowEdges(rawEdges: RawEdge[], visibleIds: Set<string>): Edge[] {
  return rawEdges
    .filter((e) => visibleIds.has(e.source_node_id) && visibleIds.has(e.target_node_id))
    .map((e) => ({
      id: e.id,
      source: e.source_node_id,
      target: e.target_node_id,
      label: e.relationship_label ?? undefined,
      labelStyle: { fontSize: 10, fill: "#64748b" },
      labelBgStyle: { fill: "#f8fafc", fillOpacity: 0.85 },
      style: { stroke: "#cbd5e1", strokeWidth: 1.5 + e.weight * 0.3 },
    }));
}

/* ── main component ───────────────────────────────────────────────── */

export default function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [rawData, setRawData] = useState<MapData | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [selectedNode, setSelectedNode] = useState<RawNode | null>(null);
  const [visibleCats, setVisibleCats] = useState(new Set(ALL_CATEGORIES));
  const [journals, setJournals] = useState<JournalItem[]>([]);
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [sourceTab, setSourceTab] = useState<"journal" | "chat">("journal");
  const [feedback, setFeedback] = useState("");

  /* initial load */
  useEffect(() => {
    loadMap();
    api.get<JournalItem[]>("/journals/").then((r) => setJournals(r.data.slice(0, 15))).catch(() => {});
    api.get<ChatItem[]>("/chat/sessions").then((r) => setChats(r.data.slice(0, 10))).catch(() => {});
  }, []);

  const loadMap = async () => {
    try {
      const res = await api.get<MapData>("/mindmap/");
      applyData(res.data, visibleCats);
      setRawData(res.data);
    } catch {}
    setLoading(false);
  };

  const applyData = useCallback((data: MapData, cats: Set<string>) => {
    const visibleIds = new Set(data.nodes.filter((n) => cats.has(n.category)).map((n) => n.id));
    setNodes(toFlowNodes(data.nodes, cats));
    setEdges(toFlowEdges(data.edges, visibleIds));
  }, []);

  /* category filter toggle */
  const toggleCat = (cat: string) => {
    setVisibleCats((prev) => {
      const next = new Set(prev);
      next.has(cat) ? next.delete(cat) : next.add(cat);
      if (rawData) applyData(rawData, next);
      return next;
    });
  };

  /* process a journal or chat */
  const processSource = async (type: "journal" | "chat", id: string) => {
    setProcessing(true);
    setFeedback("");
    try {
      const res = await api.post<MapData>(`/mindmap/process/${type}/${id}`);
      setRawData(res.data);
      applyData(res.data, visibleCats);
      setFeedback(`✓ ${res.data.nodes.length} concepts mapped`);
    } catch {
      setFeedback("Something went wrong. Try again.");
    } finally {
      setProcessing(false);
    }
  };

  /* delete a node */
  const deleteNode = async (nodeId: string) => {
    await api.delete(`/mindmap/nodes/${nodeId}`);
    const updated: MapData = {
      ...rawData!,
      nodes: rawData!.nodes.filter((n) => n.id !== nodeId),
      edges: rawData!.edges.filter(
        (e) => e.source_node_id !== nodeId && e.target_node_id !== nodeId
      ),
    };
    setRawData(updated);
    applyData(updated, visibleCats);
    setSelectedNode(null);
  };

  /* node click */
  const onNodeClick = useCallback(
    (_: unknown, node: Node) => {
      const raw = rawData?.nodes.find((n) => n.id === node.id) ?? null;
      setSelectedNode(raw);
    },
    [rawData]
  );

  /* ── render ─────────────────────────────────────────────────────── */

  const isEmpty = !loading && (!rawData || rawData.nodes.length === 0);

  return (
    <div className="-mx-8 -my-8 flex h-[calc(100vh-0px)] overflow-hidden">
      {/* ── React Flow canvas ─────────────────────────────────────── */}
      <div className="relative flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-gray-400">
            Loading your mind map…
          </div>
        ) : isEmpty ? (
          <EmptyState />
        ) : (
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onNodeClick={onNodeClick}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={3}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e2e8f0" />
            <Controls position="bottom-left" />
            <MiniMap
              nodeStrokeWidth={2}
              pannable
              zoomable
              style={{ background: "#f8fafc" }}
            />
          </ReactFlow>
        )}

        {/* selected node panel */}
        {selectedNode && (
          <NodeDetail
            node={selectedNode}
            onClose={() => setSelectedNode(null)}
            onDelete={() => deleteNode(selectedNode.id)}
          />
        )}
      </div>

      {/* ── Control sidebar ───────────────────────────────────────── */}
      <aside className="flex w-64 shrink-0 flex-col gap-5 overflow-y-auto border-l bg-white px-4 py-6 shadow-sm">
        <h2 className="text-base font-semibold text-gray-800">🧠 Mind Map</h2>

        {/* stats */}
        {rawData && (
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-indigo-50 py-2">
              <div className="text-lg font-bold text-indigo-700">{rawData.nodes.length}</div>
              <div className="text-xs text-indigo-400">concepts</div>
            </div>
            <div className="rounded-lg bg-purple-50 py-2">
              <div className="text-lg font-bold text-purple-700">{rawData.edges.length}</div>
              <div className="text-xs text-purple-400">links</div>
            </div>
          </div>
        )}

        {/* category filter */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Filter by type
          </p>
          <div className="flex flex-wrap gap-1.5">
            {ALL_CATEGORIES.map((cat) => {
              const c = CAT[cat];
              const active = visibleCats.has(cat);
              return (
                <button
                  key={cat}
                  onClick={() => toggleCat(cat)}
                  style={
                    active ? { background: c.bg, borderColor: c.border, color: c.text } : {}
                  }
                  className={`rounded-full border px-2.5 py-0.5 text-xs font-medium transition-all ${
                    active ? "" : "border-gray-200 bg-gray-50 text-gray-400"
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* add content */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">
            Extract from
          </p>
          <div className="mb-2 flex rounded-lg border border-gray-200 overflow-hidden">
            {(["journal", "chat"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setSourceTab(t)}
                className={`flex-1 py-1.5 text-xs font-medium transition-colors ${
                  sourceTab === t
                    ? "bg-indigo-600 text-white"
                    : "bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                {t === "journal" ? "📓 Journal" : "💬 Chat"}
              </button>
            ))}
          </div>

          {sourceTab === "journal" ? (
            journals.length ? (
              <ul className="space-y-1 max-h-52 overflow-y-auto">
                {journals.map((j) => (
                  <SourceItem
                    key={j.id}
                    label={j.title}
                    onClick={() => processSource("journal", j.id)}
                    disabled={processing}
                  />
                ))}
              </ul>
            ) : (
              <p className="text-xs text-gray-400">No journals yet.</p>
            )
          ) : chats.length ? (
            <ul className="space-y-1 max-h-52 overflow-y-auto">
              {chats.map((c) => (
                <SourceItem
                  key={c.id}
                  label={c.title ?? "Untitled chat"}
                  onClick={() => processSource("chat", c.id)}
                  disabled={processing}
                />
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400">No chats yet.</p>
          )}

          {processing && (
            <p className="mt-2 text-xs text-indigo-500 animate-pulse">Extracting concepts…</p>
          )}
          {feedback && !processing && (
            <p className="mt-2 text-xs text-green-600">{feedback}</p>
          )}
        </div>

        {/* danger zone */}
        {rawData && rawData.nodes.length > 0 && (
          <div className="mt-auto pt-4 border-t border-gray-100">
            <button
              onClick={async () => {
                if (confirm("Clear your entire mind map?")) {
                  await api.delete("/mindmap/");
                  setRawData({ map_id: rawData.map_id, nodes: [], edges: [], updated_at: new Date().toISOString() });
                  setNodes([]);
                  setEdges([]);
                  setSelectedNode(null);
                }
              }}
              className="w-full rounded-lg border border-red-200 py-1.5 text-xs text-red-400 hover:bg-red-50 hover:text-red-600"
            >
              Clear all
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}

/* ── sub-components ───────────────────────────────────────────────── */

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center px-8">
      <div className="text-5xl">🧠</div>
      <h3 className="text-lg font-semibold text-gray-700">Your mind map is empty</h3>
      <p className="max-w-xs text-sm text-gray-400">
        Select a journal or chat from the sidebar to extract concepts and build your personal
        knowledge graph.
      </p>
    </div>
  );
}

function NodeDetail({
  node,
  onClose,
  onDelete,
}: {
  node: RawNode;
  onClose: () => void;
  onDelete: () => void;
}) {
  const colors = CAT[node.category] ?? CAT.topic;
  return (
    <div
      className="absolute bottom-6 left-6 z-10 w-56 rounded-xl border bg-white p-4 shadow-lg"
      style={{ borderColor: colors.border }}
    >
      <div className="flex items-start justify-between">
        <div>
          <span
            className="inline-block rounded-full px-2 py-0.5 text-xs font-semibold mb-1"
            style={{ background: colors.bg, color: colors.text }}
          >
            {node.category}
          </span>
          <p className="font-semibold text-gray-800">{node.label}</p>
        </div>
        <button onClick={onClose} className="text-gray-300 hover:text-gray-500 text-lg leading-none">×</button>
      </div>
      <p className="mt-2 text-xs text-gray-400">
        Mentioned <span className="font-medium text-gray-600">{node.weight}×</span>
      </p>
      <button
        onClick={onDelete}
        className="mt-3 w-full rounded-lg border border-red-200 py-1 text-xs text-red-400 hover:bg-red-50"
      >
        Remove node
      </button>
    </div>
  );
}

function SourceItem({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <li>
      <button
        onClick={onClick}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-100 px-3 py-2 text-left text-xs text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 disabled:opacity-40 truncate"
      >
        {label}
      </button>
    </li>
  );
}
