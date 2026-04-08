import { useState, useEffect, useCallback } from 'react';
import {
  Node, Edge, addEdge, Connection,
  useNodesState, useEdgesState
} from 'reactflow';
import 'reactflow/dist/style.css';
import { CommandBar } from './components/CommandBar';
import { StatusFeed } from './components/StatusFeed';
import { ModelSelector } from './components/ModelSelector';
import { RegulationPanel } from './components/RegulationPanel';
import { FileExplorer } from './components/FileExplorer';
import { ContributePanel } from './components/ContributePanel';
import { Canvas } from './components/Canvas';
import { NodeEditor } from './components/NodeEditor';
import { WorkflowGraph, VibeMessage } from '../src/types';

declare const acquireVsCodeApi: () => { postMessage: (msg: any) => void };
const vscode = acquireVsCodeApi();

type Tab = 'canvas' | 'models' | 'regulations' | 'files' | 'contribute';

export default function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [activeTab, setActiveTab] = useState<Tab>('canvas');
  const [statusLog, setStatusLog] = useState<Array<{ text: string; stage: string; time: string }>>([]);
  const [models, setModels] = useState<any[]>([]);
  const [regulations, setRegulations] = useState<any[]>([]);
  const [generatedFiles, setGeneratedFiles] = useState<any>(null);
  const [currentWorkflow, setCurrentWorkflow] = useState<WorkflowGraph | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const onConnect = useCallback((c: Connection) => setEdges(e => addEdge(c, e)), []);

  const addStatus = (text: string, stage: string) => {
    setStatusLog(prev => [...prev, { text, stage, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg: VibeMessage & any = event.data;
      switch (msg.command) {
        case 'injectPrompt':
          handlePrompt(msg.prompt!);
          break;
        case 'status':
          addStatus(msg.text!, msg.stage!);
          break;
        case 'renderWorkflow':
          renderWorkflow(msg.workflow!);
          setCurrentWorkflow(msg.workflow!);
          break;
        case 'workflowComplete':
          setIsLoading(false);
          break;
        case 'executionFinished':
          setIsLoading(false);
          break;
        case 'modelsFound':
          setModels(msg.models);
          setActiveTab('models');
          setIsLoading(false);
          break;
        case 'regulationsFound':
          setRegulations(msg.regulations);
          setActiveTab('regulations');
          setIsLoading(false);
          break;
        case 'filesGenerated':
          setGeneratedFiles(msg.files);
          setActiveTab('files');
          setIsLoading(false);
          break;
        case 'error':
          addStatus(`❌ ${msg.text}`, 'error');
          setIsLoading(false);
          break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [currentWorkflow]);

  const renderWorkflow = (workflow: WorkflowGraph) => {
    const flowNodes: Node[] = workflow.nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: { label: `${getNodeEmoji(n.type)} ${n.label}`, type: n.type, app: n.app },
      style: getNodeStyle(n.type)
    }));
    const flowEdges: Edge[] = workflow.edges.map(([s, t], i) => ({
      id: `e${i}`, source: s, target: t, animated: true
    }));
    setNodes(flowNodes);
    setEdges(flowEdges);
    setActiveTab('canvas');
  };

  const handlePrompt = (prompt: string) => {
    setIsLoading(true);
    addStatus(`📝 Processing: "${prompt}"`, 'input');
    vscode.postMessage({ command: 'buildWorkflow', prompt });
  };

  const handleRunWorkflow = () => {
    if (!currentWorkflow) return;
    setIsLoading(true);
    vscode.postMessage({ command: 'runWorkflow', workflow: currentWorkflow });
  };

  const handleSetupComposio = () => {
    vscode.postMessage({ command: 'setupComposio' });
  };

  const handleUpdateNode = (nodeId: string, data: any) => {
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data } : n));
    addStatus(`🛠️ Updated node: ${data.label}`, 'input');
  };

  const handleSearchModels = (prompt?: string) => {
    setIsLoading(true);
    vscode.postMessage({ command: 'searchModels', prompt: prompt || currentWorkflow?.description });
  };

  const handleRegulations = () => {
    setIsLoading(true);
    vscode.postMessage({ command: 'checkRegulations', prompt: currentWorkflow?.description });
  };

  const handleGenerateFiles = () => {
    setIsLoading(true);
    vscode.postMessage({ command: 'generateFiles' });
  };

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'canvas', label: 'Canvas', emoji: '🎨' },
    { id: 'models', label: 'Models', emoji: '🤖' },
    { id: 'regulations', label: 'Compliance', emoji: '⚖️' },
    { id: 'files', label: 'Files', emoji: '📁' },
    { id: 'contribute', label: 'Contribute', emoji: '⭐' }
  ];

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.logo}>⚡ VibeFlow</span>
        <span style={styles.byline}>by Virgil Junior Adoleyine 🇬🇭</span>
        <a
          onClick={() => vscode.postMessage({ command: 'openExternal', url: 'https://vibeflow-cloud.vercel.app' })}
          style={styles.cloudLink}
        >
          Cloud ↗
        </a>
      </div>

      {/* Command Bar */}
      <CommandBar onSubmit={handlePrompt} isLoading={isLoading} />

      {/* Tabs */}
      <div style={styles.tabs}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            style={{ ...styles.tab, ...(activeTab === tab.id ? styles.tabActive : {}) }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={styles.content}>
        {activeTab === 'canvas' && (
          <>
            <div style={styles.canvasToolbar}>
              <button
                onClick={handleRunWorkflow}
                disabled={isLoading || nodes.length === 0}
                style={{ ...styles.actionBtn, background: '#34a853' }}
              >
                ▶ Run Workflow
              </button>
              <button
                onClick={handleSetupComposio}
                style={{ ...styles.actionBtn, background: '#9c27b0' }}
              >
                🔌 Setup Composio Apps
              </button>
            </div>
            <Canvas
              nodes={nodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={(_e, node) => setSelectedNode(node)}
            />
            {selectedNode && (
              <NodeEditor
                node={selectedNode}
                onSave={handleUpdateNode}
                onClose={() => setSelectedNode(null)}
              />
            )}
          </>
        )}

        {activeTab === 'models' && (
          <ModelSelector
            models={models}
            onSearch={handleSearchModels}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'regulations' && (
          <RegulationPanel
            regulations={regulations}
            onScan={handleRegulations}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'files' && (
          <FileExplorer
            files={generatedFiles}
            onGenerate={handleGenerateFiles}
            isLoading={isLoading}
          />
        )}

        {activeTab === 'contribute' && <ContributePanel vscode={vscode} />}
      </div>

      {/* Status Feed */}
      <StatusFeed logs={statusLog} />
    </div>
  );
}

function getNodeEmoji(type: string): string {
  const map: Record<string, string> = {
    trigger: '⏰', action: '⚙️', llm: '🧠', condition: '🔀',
    transform: '🔄', code: '💻', output: '📤'
  };
  return map[type] || '📦';
}

function getNodeStyle(type: string): React.CSSProperties {
  const colors: Record<string, string> = {
    trigger: '#1a73e8', action: '#34a853', llm: '#9c27b0',
    condition: '#f9ab00', transform: '#00acc1', code: '#e64a19', output: '#43a047'
  };
  return {
    background: colors[type] || '#555',
    color: '#fff',
    borderRadius: 8,
    padding: '8px 12px',
    fontSize: 12,
    fontWeight: 600,
    border: '2px solid rgba(255,255,255,0.2)'
  };
}

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex', flexDirection: 'column', height: '100vh',
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    fontFamily: 'var(--vscode-font-family)',
    fontSize: 13
  },
  header: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 16px',
    borderBottom: '1px solid var(--vscode-panel-border)',
    background: 'var(--vscode-sideBar-background)'
  },
  logo: { fontWeight: 700, fontSize: 15, color: '#00d4ff' },
  byline: { fontSize: 11, opacity: 0.6 },
  cloudLink: {
    marginLeft: 'auto', cursor: 'pointer',
    color: '#00d4ff', fontSize: 11, textDecoration: 'underline'
  },
  tabs: { display: 'flex', borderBottom: '1px solid var(--vscode-panel-border)' },
  tab: {
    padding: '6px 14px', cursor: 'pointer', border: 'none',
    background: 'transparent', color: 'var(--vscode-editor-foreground)',
    fontSize: 12, opacity: 0.7
  },
  tabActive: {
    opacity: 1, borderBottom: '2px solid #00d4ff',
    color: '#00d4ff', background: 'rgba(0,212,255,0.05)'
  },
  content: { flex: 1, overflow: 'hidden', position: 'relative' },
  canvasToolbar: {
    position: 'absolute', top: 10, left: 10, zIndex: 10,
    display: 'flex', gap: 8
  },
  actionBtn: {
    padding: '6px 12px', borderRadius: 4, border: 'none',
    color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
  }
};
