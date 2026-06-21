import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  type Connection,
  type Edge,
} from "@xyflow/react";
import { useCallback, useMemo, useState } from "react";

import "@xyflow/react/dist/style.css";
import "./styles.css";

import {
  WorkflowNodeCard,
  type WorkflowNode,
  type WorkflowNodeData,
} from "./components/WorkflowNodeCard";
import { useWorkflowStore } from "./stores/workflowStore";

const palette = [
  { category: "trigger", icon: "↯", label: "Record created", description: "Starts when a new record is created" },
  { category: "trigger", icon: "↻", label: "Record updated", description: "Starts when selected fields change" },
  { category: "trigger", icon: "◷", label: "Scheduled time", description: "Runs on a recurring schedule" },
  { category: "action", icon: "✉", label: "Send email", description: "Send a NetSuite email message" },
  { category: "action", icon: "▣", label: "Load record", description: "Load fields from a NetSuite record" },
  { category: "action", icon: "✎", label: "Update field", description: "Update an approved record field" },
  { category: "action", icon: "⌕", label: "Saved search", description: "Execute a configured saved search" },
  { category: "logic", icon: "◇", label: "If / Else", description: "Route data using a condition" },
  { category: "logic", icon: "⑂", label: "Switch", description: "Route data across multiple branches" },
] satisfies Array<WorkflowNodeData>;

const initialNodes: WorkflowNode[] = [
  { id: "trigger-1", position: { x: 80, y: 185 }, type: "workflow", data: { category: "trigger", icon: "↯", label: "Invoice created", description: "When a new invoice is created" } },
  { id: "action-1", position: { x: 390, y: 185 }, type: "workflow", data: { category: "action", icon: "▣", label: "Load customer", description: "Get customer email and credit limit" } },
  { id: "logic-1", position: { x: 700, y: 185 }, type: "workflow", data: { category: "logic", icon: "◇", label: "Check invoice total", description: "Invoice total is greater than $5,000" } },
  { id: "action-2", position: { x: 1015, y: 90 }, type: "workflow", data: { category: "action", icon: "✉", label: "Request approval", description: "Email the finance approval team" } },
  { id: "action-3", position: { x: 1015, y: 285 }, type: "workflow", data: { category: "action", icon: "✎", label: "Mark as approved", description: "Set approval status to approved" } },
];

const initialEdges: Edge[] = [
  { id: "e1", source: "trigger-1", target: "action-1", animated: true },
  { id: "e2", source: "action-1", target: "logic-1", animated: true },
  { id: "e3", source: "logic-1", target: "action-2", label: "YES", labelStyle: { fill: "#138a57", fontWeight: 700 } },
  { id: "e4", source: "logic-1", target: "action-3", label: "NO", labelStyle: { fill: "#64748b", fontWeight: 700 } },
];
//lll
function Builder() {
  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedId, setSelectedId] = useState("logic-1");
  const [toast, setToast] = useState<string | null>(null);
  const { status, setStatus } = useWorkflowStore();
  const nodeTypes = useMemo(() => ({ workflow: WorkflowNodeCard }), []);
  const selectedNode = nodes.find((node) => node.id === selectedId);

  const onConnect = useCallback(
    (connection: Connection) => setEdges((current) => addEdge(connection, current)),
    [setEdges],
  );

  const addPaletteNode = (item: WorkflowNodeData) => {
    const id = `${item.category}-${crypto.randomUUID()}`;
    setNodes((current) => [
      ...current,
      {
        id,
        type: "workflow",
        position: { x: 460 + current.length * 32, y: 390 + (current.length % 2) * 150 },
        data: { ...item },
      },
    ]);
    setSelectedId(id);
  };

  const updateSelectedLabel = (label: string) => {
    setNodes((current) => current.map((node) => (
      node.id === selectedId ? { ...node, data: { ...node.data, label } } : node
    )));
  };

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 2400);
  };

  const runTest = () => {
    setStatus("Testing");
    window.setTimeout(() => {
      setStatus("Draft");
      showToast("Test completed — 5 nodes passed");
    }, 900);
  };

  const save = () => {
    setStatus("Saved");
    showToast("Workflow draft saved locally");
    window.setTimeout(() => setStatus("Draft"), 1600);
  };

  return (
    <div className="app-shell">
      <h1 className="sr-only">Workflow Builder</h1>
      <header className="topbar">
        <div className="brand"><span className="brand__mark">N</span><span>NetSuite Flow</span></div>
        <div className="workflow-title">
          <span>Workflows</span><span className="chevron">/</span><strong>Invoice approval</strong>
          <span className={`status status--${status.toLowerCase()}`}>{status}</span>
        </div>
        <div className="topbar__actions">
          <button className="button button--quiet" type="button" onClick={() => showToast("Workflow validation passed")}>✓ Validate</button>
          <button className="button button--outline" type="button" onClick={runTest} disabled={status === "Testing"}>{status === "Testing" ? "Running…" : "▷ Run test"}</button>
          <button className="button button--primary" type="button" onClick={save}>Save draft</button>
        </div>
      </header>

      <main className="workspace">
        <aside className="palette-panel">
          <div className="panel-heading">
            <div><h2>Nodes</h2><p>Click a node to add it</p></div>
            <button className="icon-button" aria-label="Search nodes" type="button">⌕</button>
          </div>
          {(["trigger", "action", "logic"] as const).map((category) => (
            <section className="palette-group" key={category}>
              <h3>{category === "logic" ? "Logic & flow" : `${category}s`}</h3>
              {palette.filter((item) => item.category === category).map((item) => (
                <button className="palette-item" key={item.label} type="button" onClick={() => addPaletteNode(item)}>
                  <span className={`palette-item__icon palette-item__icon--${category}`}>{item.icon}</span>
                  <span><strong>{item.label}</strong><small>{item.description}</small></span>
                  <span className="palette-item__add">+</span>
                </button>
              ))}
            </section>
          ))}
        </aside>

        <section className="canvas-panel" aria-label="Workflow canvas">
          <div className="canvas-toolbar"><span><strong>Invoice approval</strong> · {nodes.length} nodes</span><span className="saved-note">All changes saved locally</span></div>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => setSelectedId(node.id)}
            fitView
            fitViewOptions={{ padding: 0.18 }}
            minZoom={0.35}
            maxZoom={1.8}
          >
            <Background variant={BackgroundVariant.Dots} gap={20} size={1.4} color="#cbd5e1" />
            <Controls position="bottom-left" />
            <MiniMap position="bottom-right" pannable zoomable nodeColor="#7c6bf2" maskColor="rgba(241, 245, 249, 0.78)" />
          </ReactFlow>
        </section>

        <aside className="inspector-panel">
          <div className="panel-heading panel-heading--inspector">
            <div><span className="eyebrow">NODE SETTINGS</span><h2>{selectedNode?.data.label ?? "Select a node"}</h2></div>
            <button className="icon-button" aria-label="Close settings" type="button" onClick={() => setSelectedId("")}>×</button>
          </div>
          {selectedNode ? (
            <div className="inspector-content">
              <label>Node name<input value={selectedNode.data.label} onChange={(event) => updateSelectedLabel(event.target.value)} /></label>
              {selectedNode.data.category === "logic" ? (
                <>
                  <label>Value<button className="mapping-field" type="button"><span>Invoice → Total</span><span>⌄</span></button></label>
                  <label>Operator<select defaultValue="greater"><option value="greater">is greater than</option><option value="equal">is equal to</option><option value="less">is less than</option></select></label>
                  <label>Compare with<div className="money-input"><span>$</span><input defaultValue="5,000" /></div></label>
                  <div className="branch-summary">
                    <div><span className="branch-dot branch-dot--yes" />Yes branch<strong>Request approval</strong></div>
                    <div><span className="branch-dot" />No branch<strong>Mark as approved</strong></div>
                  </div>
                </>
              ) : (
                <>
                  <label>Record type<select defaultValue="invoice"><option value="invoice">Invoice</option><option value="customer">Customer</option><option value="salesorder">Sales order</option></select></label>
                  <label>Description<textarea defaultValue={selectedNode.data.description} rows={4} /></label>
                </>
              )}
              <div className="inspector-tip"><span>✦</span><p><strong>Data mapping</strong>Use outputs from previous nodes as dynamic values.</p></div>
              <button className="delete-button" type="button" onClick={() => setNodes((current) => current.filter((node) => node.id !== selectedId))}>Delete node</button>
            </div>
          ) : <div className="empty-inspector">Select a node on the canvas to edit its settings.</div>}
        </aside>
      </main>
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </div>
  );
}

export function App() {
  return <ReactFlowProvider><Builder /></ReactFlowProvider>;
}
