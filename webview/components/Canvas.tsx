import React from 'react';
import ReactFlow, {
  Background, Controls, MiniMap,
  Node, Edge, OnNodesChange, OnEdgesChange, OnConnect
} from 'reactflow';
import 'reactflow/dist/style.css';

interface Props {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
}

export function Canvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect }: Props) {
  return (
    <div style={styles.canvasWrap}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {nodes.length === 0 && (
        <div style={styles.emptyCanvas}>
          <div style={styles.emptyIcon}>⚡</div>
          <div>Describe a workflow above to get started</div>
          <div style={styles.emptyHint}>e.g. "Every morning summarize my Gmail and post to Slack"</div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  canvasWrap: { width: '100%', height: '100%', position: 'relative' },
  emptyCanvas: {
    position: 'absolute', top: '50%', left: '50%',
    transform: 'translate(-50%,-50%)',
    textAlign: 'center', opacity: 0.5
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyHint: { fontSize: 11, marginTop: 6, fontStyle: 'italic' }
};
