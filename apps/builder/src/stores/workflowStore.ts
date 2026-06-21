import { create } from "zustand";

type WorkflowStatus = "Draft" | "Testing" | "Saved";

interface WorkflowState {
  status: WorkflowStatus;
  setStatus: (status: WorkflowStatus) => void;
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  status: "Draft",
  setStatus: (status) => set({ status }),
}));
