import React, { useState, useEffect } from 'react';

interface Props {
  node: any;
  onSave: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export function NodeEditor({ node, onSave, onClose }: Props) {
  const [label, setLabel] = useState(node.data.label || '');
  const [code, setCode] = useState(node.data.code || '');
  const [config, setConfig] = useState(JSON.stringify(node.data.config || {}, null, 2));
  const [activeTab, setActiveTab] = useState<'code' | 'config'>('code');

  useEffect(() => {
    setLabel(node.data.label || '');
    setCode(node.data.code || '');
    setConfig(JSON.stringify(node.data.config || {}, null, 2));
  }, [node]);

  const handleSave = () => {
    let parsedConfig = {};
    try {
      parsedConfig = JSON.parse(config);
    } catch (e) {
      alert('Invalid JSON in configuration');
      return;
    }

    onSave(node.id, { 
      ...node.data, 
      label, 
      code, 
      config: parsedConfig,
      isEdited: true 
    });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <div style={styles.titleGroup}>
            <span style={styles.nodeIcon}>⚡</span>
            <input
              style={styles.titleInput}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Node Label"
            />
          </div>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>

        <div style={styles.tabBar}>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'code' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('code')}
          >
            Python Code
          </button>
          <button 
            style={{ ...styles.tab, ...(activeTab === 'config' ? styles.tabActive : {}) }}
            onClick={() => setActiveTab('config')}
          >
            Credentials & Config
          </button>
        </div>

        <div style={styles.body}>
          {activeTab === 'code' ? (
            <textarea
              style={styles.codeEditor}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              spellCheck={false}
              placeholder="# Write your Python code here..."
            />
          ) : (
            <div style={styles.configWrap}>
              <div style={styles.fieldLabel}>JSON Configuration (Credentials, Params, etc.)</div>
              <textarea
                style={styles.configEditor}
                value={config}
                onChange={(e) => setConfig(e.target.value)}
                spellCheck={false}
              />
              <div style={styles.hint}>
                Tip: Use VIBEFLOW_ prefix in your code for environment variables defined in settings.
              </div>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button onClick={onClose} style={styles.cancelBtn}>Cancel</button>
          <button onClick={handleSave} style={styles.saveBtn}>Apply Changes</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    background: 'rgba(0,0,0,0.7)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'center',
    backdropFilter: 'blur(2px)'
  },
  panel: {
    background: 'var(--vscode-sideBar-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: 12, width: '80%', maxWidth: 800, height: '80%', 
    display: 'flex', flexDirection: 'column',
    boxShadow: '0 8px 32px rgba(0,0,0,0.5)', overflow: 'hidden'
  },
  header: { 
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
    padding: '12px 16px', borderBottom: '1px solid var(--vscode-panel-border)'
  },
  titleGroup: { display: 'flex', alignItems: 'center', gap: 12, flex: 1 },
  nodeIcon: { fontSize: 20 },
  titleInput: {
    background: 'transparent', border: 'none', color: '#fff', 
    fontSize: 16, fontWeight: 600, width: '100%', outline: 'none'
  },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 24, cursor: 'pointer', opacity: 0.6 },
  tabBar: { display: 'flex', background: 'var(--vscode-editor-background)', padding: '0 8px' },
  tab: {
    padding: '10px 16px', background: 'transparent', border: 'none', 
    color: 'var(--vscode-editor-foreground)', opacity: 0.6, cursor: 'pointer', fontSize: 12
  },
  tabActive: {
    opacity: 1, borderBottom: '2px solid #00d4ff', color: '#00d4ff'
  },
  body: { flex: 1, padding: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  codeEditor: {
    flex: 1, width: '100%', background: '#1e1e1e', color: '#d4d4d4',
    fontFamily: 'var(--vscode-editor-font-family, monospace)', fontSize: 13,
    padding: 12, border: '1px solid #333', borderRadius: 4, resize: 'none', outline: 'none'
  },
  configWrap: { display: 'flex', flexDirection: 'column', height: '100%', gap: 8 },
  fieldLabel: { fontSize: 11, opacity: 0.7, fontWeight: 600 },
  configEditor: {
    flex: 1, width: '100%', background: '#1e1e1e', color: '#9cdcfe',
    fontFamily: 'monospace', fontSize: 13,
    padding: 12, border: '1px solid #333', borderRadius: 4, resize: 'none', outline: 'none'
  },
  hint: { fontSize: 11, opacity: 0.5, fontStyle: 'italic' },
  footer: { 
    display: 'flex', justifyContent: 'flex-end', gap: 12, padding: 16,
    borderTop: '1px solid var(--vscode-panel-border)', background: 'var(--vscode-sideBar-background)'
  },
  cancelBtn: {
    padding: '8px 16px', borderRadius: 4, cursor: 'pointer',
    background: 'transparent', border: '1px solid var(--vscode-panel-border)', 
    color: '#fff', fontSize: 12
  },
  saveBtn: {
    padding: '8px 16px', borderRadius: 4, cursor: 'pointer',
    background: '#00d4ff', border: 'none', color: '#000', fontWeight: 600, fontSize: 12
  }
};
