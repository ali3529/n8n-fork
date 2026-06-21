import { Handle, Position, type Node, type NodeProps } from "@xyflow/react";

export interface WorkflowNodeData extends Record<string, unknown> {
  category: "trigger" | "action" | "logic";
  description: string;
  icon: string;
  label: string;
}

export type WorkflowNode = Node<WorkflowNodeData, "workflow">;

const categoryLabels = {
  trigger: "TRIGGER",
  action: "ACTION",
  logic: "CONDITION",
} as const;

export function WorkflowNodeCard({ data, selected }: NodeProps<WorkflowNode>) {
  return (
    <div className={`workflow-node workflow-node--${data.category} ${selected ? "is-selected" : ""}`}>
      {data.category !== "trigger" && (
        <Handle className="workflow-handle" position={Position.Left} type="target" />
      )}
      <div className="workflow-node__topline">
        <span className="workflow-node__icon" aria-hidden="true">{data.icon}</span>
        <span>{categoryLabels[data.category]}</span>
        <button className="workflow-node__menu" aria-label={`More options for ${data.label}`} type="button">•••</button>
      </div>
      <strong>{data.label}</strong>
      <p>{data.description}</p>
      <Handle className="workflow-handle" position={Position.Right} type="source" />
    </div>
  );
}
