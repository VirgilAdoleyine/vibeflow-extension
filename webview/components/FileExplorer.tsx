import React from 'react';

interface GeneratedFiles {
  pythonFile: string;
  envFile: string;
  readmeFile: string;
  dirStructure: string[];
}

interface Props {
  files: GeneratedFiles | null;
  onGenerate: () => void;
  isLoading: boolean;
}

export function FileExplorer({ files, onGenerate, isLoading }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>📁 Generated Workflow Files</h3>
        <button onClick={onGenerate} disabled={isLoading} style={styles.btn}>
          {isLoading ? 'Generating...' : 'Regenerate Files'}
        </button>
      </div>

      {!files ? (
        <div style={styles.empty}>
          <p>No files generated yet.</p>
          <button onClick={onGenerate} disabled={isLoading} style={styles.btnBig}>
            {isLoading ? 'Processing...' : '⚡ Generate Files Now'}
          </button>
        </div>
      ) : (
        <div style={styles.content}>
          <div style={styles.dirSection}>
            <div style={styles.sectionTitle}>Structure</div>
            <div style={styles.dirList}>
              {files.dirStructure.map((path, i) => (
                <div key={i} style={styles.dirItem}>
                  {path.endsWith('/') ? '📁' : '📄'} {path}
                </div>
              ))}
            </div>
            <div style={styles.hint}>Files saved to your workspace's <code>workflows/</code> directory.</div>
          </div>

          <div style={styles.fileSection}>
            <div style={styles.sectionTitle}>agent.py Preview</div>
            <pre style={styles.code}>
              <code>{files.pythonFile.slice(0, 500)}...</code>
            </pre>
          </div>

          <div style={styles.fileSection}>
            <div style={styles.sectionTitle}>.env.local Preview</div>
            <pre style={styles.code}>
              <code>{files.envFile}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 20, overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  content: { display: 'flex', flexDirection: 'column', gap: 24 },
  sectionTitle: { fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#00d4ff', opacity: 0.8 },
  dirSection: { padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8 },
  dirList: { fontSize: 12, fontFamily: 'monospace', lineHeight: 1.6 },
  dirItem: { marginBottom: 4 },
  fileSection: { padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 8 },
  code: {
    fontSize: 11, fontFamily: 'monospace', padding: 12, borderRadius: 4,
    background: 'var(--vscode-editor-background)', overflowX: 'auto',
    border: '1px solid var(--vscode-panel-border)', opacity: 0.8
  },
  hint: { fontSize: 10, marginTop: 12, opacity: 0.5, fontStyle: 'italic' },
  btn: {
    padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
    background: '#00d4ff', border: 'none', color: '#000', fontWeight: 600
  },
  btnBig: {
    padding: '12px 24px', borderRadius: 6, cursor: 'pointer',
    background: '#00d4ff', border: 'none', color: '#000', fontWeight: 700,
    marginTop: 20, fontSize: 14
  },
  empty: { opacity: 0.5, textAlign: 'center', marginTop: 100 }
};
