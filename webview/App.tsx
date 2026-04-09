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
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const addStatus = (text: string, stage: string) => {
    setStatusLog(prev => [...prev, { text, stage, time: new Date().toLocaleTimeString() }]);
  };

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg: VibeMessage & any = event.data;
      switch (msg.command) {
        case 'injectPrompt': handlePrompt(msg.prompt!); break;
        case 'status': addStatus(msg.text!, msg.stage!); break;
        case 'renderWorkflow': renderWorkflow(msg.workflow!); setCurrentWorkflow(msg.workflow!); break;
        case 'workflowComplete': setIsLoading(false); break;
        case 'executionFinished': setIsLoading(false); setIsExecuting(false); break;
        case 'modelsFound': setModels(msg.models); setActiveTab('models'); setIsLoading(false); break;
        case 'regulationsFound': setRegulations(msg.regulations); setActiveTab('regulations'); setIsLoading(false); break;
        case 'filesGenerated': setGeneratedFiles(msg.files); setActiveTab('files'); setIsLoading(false); break;
        case 'error': addStatus(`❌ ${msg.text}`, 'error'); setIsLoading(false); setIsExecuting(false); break;
        case 'nodeCodeUpdated':
          setNodes(nds => nds.map(n => n.id === msg.nodeId ? { ...n, data: { ...n.data, code: msg.code } } : n));
          break;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [currentWorkflow]);

  const onConnect = useCallback((c: Connection) => setEdges(e => addEdge(c, e)), []);

  const renderWorkflow = (workflow: WorkflowGraph) => {
    const flowNodes: Node[] = workflow.nodes.map(n => ({
      id: n.id,
      position: n.position,
      data: { 
        label: n.label, 
        displayLabel: `${getNodeEmoji(n.type)} ${n.label}`,
        type: n.type, app: n.app, code: n.code, config: n.config
      },
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
    addStatus(`📝 Planning: "${prompt}"`, 'input');
    vscode.postMessage({ command: 'buildWorkflow', prompt });
  };

  const handleRunWorkflow = () => {
    const workflowToRun: WorkflowGraph = {
      description: currentWorkflow?.description || 'Manual Run',
      nodes: nodes.map(n => ({
        id: n.id, type: n.data.type, label: n.data.label,
        app: n.data.app, code: n.data.code, config: n.data.config,
        position: n.position
      })),
      edges: edges.map(e => [e.source, e.target]),
      steps: currentWorkflow?.steps || []
    };
    setIsExecuting(true);
    addStatus('🚀 Launching workflow execution engine...', 'executor');
    vscode.postMessage({ command: 'runWorkflow', workflow: workflowToRun });
  };

  const handleStopWorkflow = () => {
    vscode.postMessage({ command: 'stopExecution' });
    setIsExecuting(false);
  };

  const handleUpdateNode = (nodeId: string, data: any) => {
    const updatedData = { ...data, displayLabel: `${getNodeEmoji(data.type)} ${data.label}` };
    setNodes(nds => nds.map(n => n.id === nodeId ? { ...n, data: updatedData } : n));
    vscode.postMessage({ command: 'updateNodeData', nodeId, label: data.label, code: data.code, config: data.config });
    addStatus(`🛠️ Node configured: ${data.label}`, 'input');
  };

  const TABS: { id: Tab; label: string; emoji: string }[] = [
    { id: 'canvas', label: 'Canvas', emoji: '🎨' },
    { id: 'models', label: 'Models', emoji: '🤖' },
    { id: 'regulations', label: 'Security', emoji: '🛡️' },
    { id: 'files', label: 'Source', emoji: '📂' },
    { id: 'contribute', label: 'Registry', emoji: '📦' }
  ];

  return (
    <div style={styles.root}>
      {/* Top Bar */}
      <div style={styles.topBar}>
        <div style={styles.brand}>
          <span style={styles.brandLogo}>⚡</span>
          <span style={styles.brandName}>VibeFlow <span style={styles.brandVersion}>v2.0 PRO</span></span>
        </div>
        <div style={styles.topActions}>
          <button onClick={() => vscode.postMessage({ command: 'openExternal', url: 'https://vibeflow-cloud.vercel.app' })} style={styles.topBtn}>
            Cloud Console ↗
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div style={styles.main}>
        {/* Sidebar Tabs */}
        <div style={styles.sidebar}>
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ ...styles.sideTab, ...(activeTab === tab.id ? styles.sideTabActive : {}) }}>
              <span style={styles.tabEmoji}>{tab.emoji}</span>
              <span style={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <div style={styles.attribution}>
            by Virgil Junior 🇬🇭
          </div>
        </div>

        {/* Workspace */}
        <div style={styles.workspace}>
          {/* Header/Command Area */}
          <div style={styles.commandHeader}>
            <CommandBar onSubmit={handlePrompt} isLoading={isLoading} />
            <div style={styles.workflowControls}>
              {!isExecuting ? (
                <button onClick={handleRunWorkflow} disabled={nodes.length === 0} style={styles.runBtn}>
                  ▶ Run Workflow
                </button>
              ) : (
                <button onClick={handleStopWorkflow} style={styles.stopBtn}>
                  ⏹ Stop Execution
                </button>
              )}
              <button onClick={() => vscode.postMessage({ command: 'setupComposio' })} style={styles.setupBtn}>
                🔌 Manage Apps
              </button>
            </div>
          </div>

          {/* Tab Content */}
          <div style={styles.tabContent}>
            {activeTab === 'canvas' && (
              <div style={styles.canvasContainer}>
                <Canvas
                  nodes={nodes} edges={edges}
                  onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                  onConnect={onConnect} onNodeClick={(_e, node) => setSelectedNode(node)}
                />
                {selectedNode && (
                  <NodeEditor node={selectedNode} onSave={handleUpdateNode} onClose={() => setSelectedNode(null)} />
                )}
              </div>
            )}
            {activeTab === 'models' && <ModelSelector models={models} onSearch={() => vscode.postMessage({ command: 'searchModels' })} isLoading={isLoading} />}
            {activeTab === 'regulations' && <RegulationPanel regulations={regulations} onScan={() => vscode.postMessage({ command: 'checkRegulations' })} isLoading={isLoading} />}
            {activeTab === 'files' && <FileExplorer files={generatedFiles} onGenerate={() => vscode.postMessage({ command: 'generateFiles' })} isLoading={isLoading} />}
            {activeTab === 'contribute' && <ContributePanel vscode={vscode} />}
          </div>
        </div>
      </div>

      {/* Bottom Status Feed */}
      <StatusFeed logs={statusLog} />
    </div>
  );
}

function getNodeEmoji(type: string): string {
  const map: Record<string, string> = { trigger: '⚡', action: '⚙️', llm: '🧠', condition: '🔀', transform: '🔄', code: '💻', output: '📤' };
  return map[type] || '📦';
}

function getNodeStyle(type: string): React.CSSProperties {
  const colors: Record<string, string> = { trigger: '#007acc', action: '#28a745', llm: '#6f42c1', condition: '#d19a66', transform: '#00bcd4', code: '#f44336', output: '#21ba45' };
  return {
    background: 'var(--vscode-editor-background)',
    color: 'var(--vscode-editor-foreground)',
    borderRadius: '4px', border: `1px solid ${colors[type] || '#555'}`,
    padding: '10px 14px', fontSize: '12px', fontWeight: 500,
    boxShadow: '0 2px 8px rgba(0,0,0,0.2)', borderLeft: `4px solid ${colors[type] || '#555'}`
  };
}

const styles: Record<string, React.CSSProperties> = {
  root: { display: 'flex', flexDirection: 'column', height: '100vh', background: 'var(--vscode-editor-background)', color: 'var(--vscode-editor-foreground)', fontFamily: 'Inter, system-ui, sans-serif', fontSize: '13px', overflow: 'hidden' },
  topBar: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px', height: '40px', background: 'var(--vscode-sideBar-background)', borderBottom: '1px solid var(--vscode-panel-border)' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  brandLogo: { fontSize: '18px' },
  brandName: { fontWeight: 700, fontSize: '14px', letterSpacing: '-0.5px' },
  brandVersion: { fontSize: '9px', background: '#00d4ff', color: '#000', padding: '1px 4px', borderRadius: '3px', marginLeft: '4px', verticalAlign: 'middle' },
  topActions: { display: 'flex', gap: '8px' },
  topBtn: { background: 'transparent', border: 'none', color: '#00d4ff', fontSize: '11px', cursor: 'pointer', textDecoration: 'underline' },
  main: { display: 'flex', flex: 1, overflow: 'hidden' },
  sidebar: { width: '80px', background: 'var(--vscode-sideBar-background)', borderRight: '1px solid var(--vscode-panel-border)', display: 'flex', flexDirection: 'column', padding: '12px 0' },
  sideTab: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', padding: '12px 0', background: 'transparent', border: 'none', color: 'var(--vscode-foreground)', cursor: 'pointer', opacity: 0.5, transition: 'all 0.2s' },
  sideTabActive: { opacity: 1, background: 'rgba(0, 212, 255, 0.1)', color: '#00d4ff' },
  tabEmoji: { fontSize: '20px' },
  tabLabel: { fontSize: '10px', fontWeight: 600 },
  attribution: { fontSize: '9px', opacity: 0.4, textAlign: 'center', padding: '10px' },
  workspace: { flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--vscode-editor-background)' },
  commandHeader: { padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--vscode-sideBar-background)', borderBottom: '1px solid var(--vscode-panel-border)' },
  workflowControls: { display: 'flex', gap: '10px' },
  runBtn: { padding: '8px 16px', borderRadius: '4px', background: '#28a745', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' },
  stopBtn: { padding: '8px 16px', borderRadius: '4px', background: '#f44336', border: 'none', color: '#fff', fontSize: '12px', fontWeight: 700, cursor: 'pointer' },
  setupBtn: { padding: '8px 16px', borderRadius: '4px', background: 'var(--vscode-button-secondaryBackground)', border: 'none', color: 'var(--vscode-button-secondaryForeground)', fontSize: '12px', fontWeight: 600, cursor: 'pointer' },
  tabContent: { flex: 1, position: 'relative', overflow: 'hidden' },
  canvasContainer: { width: '100%', height: '100%' }
};

