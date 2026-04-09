export interface WorkflowNode {
  id: string;
  type: 'trigger' | 'action' | 'llm' | 'condition' | 'transform' | 'code' | 'output';
  label: string;
  app?: string;
  config?: Record<string, any>;
  code?: string;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  source: string;
  target: string;
}

export interface WorkflowGraph {
  description: string;
  nodes: WorkflowNode[];
  edges: [string, string][];
  steps: string[];
}

export interface VibeMessage {
  command: string;
  prompt?: string;
  code?: string;
  error?: string;
  url?: string;
  text?: string;
  workflow?: WorkflowGraph;
  dirPath?: string;
  nodeId?: string;
}
