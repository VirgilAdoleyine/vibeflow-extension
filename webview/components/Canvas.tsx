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
  onNodeClick: (event: React.MouseEvent, node: Node) => void;
}

export function Canvas({ nodes, edges, onNodesChange, onEdgesChange, onConnect, onNodeClick }: Props) {
  return (
    <div style={styles.canvasWrap}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
      {nodes.length === 0 && (
        <div style={styles.emptyCanvas}>
          <div style={{ ...styles.emptyIcon, animation: 'pulse 2s infinite' }}>⚡</div>
          <h2 style={{ color: 'var(--vscode-editor-foreground)', opacity: 0.9 }}>Ready for Liftoff</h2>
          <p style={styles.emptyHint}>Type your automation goal in the command bar above.</p>
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
