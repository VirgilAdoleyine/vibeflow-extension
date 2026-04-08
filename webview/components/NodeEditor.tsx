import React, { useState, useEffect } from 'react';

interface Props {
  node: any;
  onSave: (nodeId: string, data: any) => void;
  onClose: () => void;
}

export function NodeEditor({ node, onSave, onClose }: Props) {
  const [label, setLabel] = useState(node.data.label);

  useEffect(() => {
    setLabel(node.data.label);
  }, [node]);

  const handleSave = () => {
    onSave(node.id, { ...node.data, label, isEdited: true });
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.panel}>
        <div style={styles.header}>
          <h4>Edit Node: {node.id}</h4>
          <button onClick={onClose} style={styles.closeBtn}>×</button>
        </div>
        <div style={styles.body}>
          <div style={styles.field}>
            <label style={styles.label}>Node Label</label>
            <input
              style={styles.input}
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>
          <div style={styles.hint}>
            App Integration: {node.data.app || 'Generic'}
          </div>
        </div>
        <div style={styles.footer}>
          <button onClick={handleSave} style={styles.saveBtn}>Save Changes</button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'absolute', top: 0, right: 0, bottom: 0, left: 0,
    background: 'rgba(0,0,0,0.5)', zIndex: 1000,
    display: 'flex', justifyContent: 'center', alignItems: 'center'
  },
  panel: {
    background: 'var(--vscode-sideBar-background)',
    border: '1px solid var(--vscode-panel-border)',
    borderRadius: 8, width: 300, padding: 16, boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
  },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  closeBtn: { background: 'none', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer' },
  field: { marginBottom: 16 },
  label: { display: 'block', fontSize: 11, opacity: 0.7, marginBottom: 4 },
  input: {
    width: '100%', padding: '8px', borderRadius: 4,
    border: '1px solid var(--vscode-input-border)',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)', outline: 'none'
  },
  hint: { fontSize: 10, opacity: 0.5, fontStyle: 'italic' },
  footer: { display: 'flex', justifyContent: 'flex-end', marginTop: 16 },
  saveBtn: {
    padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
    background: '#00d4ff', border: 'none', color: '#000', fontWeight: 600
  }
};
