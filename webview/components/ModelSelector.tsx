import React from 'react';

interface ModelResult {
  id: string;
  name: string;
  provider: string;
  strengths: string[];
  recommended: boolean;
  openRouterSlug: string;
}

interface Props {
  models: ModelResult[];
  onSearch: (prompt?: string) => void;
  isLoading: boolean;
}

export function ModelSelector({ models, onSearch, isLoading }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>🤖 Best-Fit AI Models</h3>
        <button onClick={() => onSearch()} disabled={isLoading} style={styles.btn}>
          {isLoading ? 'Searching...' : 'Refresh Suggestions'}
        </button>
      </div>

      <div style={styles.list}>
        {models.length === 0 ? (
          <div style={styles.empty}>No models suggested yet. Build a workflow or click search.</div>
        ) : (
          models.map(m => (
            <div key={m.id} style={{ ...styles.card, ...(m.recommended ? styles.cardRec : {}) }}>
              <div style={styles.cardHeader}>
                <span style={styles.name}>{m.name}</span>
                <span style={styles.provider}>{m.provider}</span>
                {m.recommended && <span style={styles.badge}>RECOMENDED</span>}
              </div>
              <div style={styles.slug}>{m.openRouterSlug}</div>
              <div style={styles.strengths}>
                {m.strengths.map(s => <span key={s} style={styles.strength}>{s}</span>)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { padding: 20, overflowY: 'auto', height: '100%' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  card: {
    padding: 16,
    borderRadius: 8,
    background: 'var(--vscode-sideBar-background)',
    border: '1px solid var(--vscode-panel-border)',
  },
  cardRec: {
    borderColor: '#00d4ff',
    background: 'rgba(0,212,255,0.05)'
  },
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { fontWeight: 700, fontSize: 14 },
  provider: { fontSize: 11, opacity: 0.6 },
  badge: {
    background: '#00d4ff', color: '#000', fontSize: 9,
    padding: '2px 6px', borderRadius: 4, fontWeight: 800
  },
  slug: { fontSize: 11, fontFamily: 'monospace', opacity: 0.7, marginBottom: 12 },
  strengths: { display: 'flex', gap: 6, flexWrap: 'wrap' },
  strength: {
    fontSize: 10, padding: '2px 8px', borderRadius: 10,
    background: 'var(--vscode-panel-border)', opacity: 0.8
  },
  btn: {
    padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
    background: '#00d4ff', border: 'none', color: '#000', fontWeight: 600
  },
  empty: { opacity: 0.5, textAlign: 'center', marginTop: 100 }
};
