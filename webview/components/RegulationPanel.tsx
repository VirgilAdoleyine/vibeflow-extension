import React from 'react';

interface RegulationResult {
  region: string;
  regulation: string;
  severity: 'high' | 'medium' | 'low';
  description: string;
  compliant: boolean;
  fix?: string;
}

interface Props {
  regulations: RegulationResult[];
  onScan: () => void;
  isLoading: boolean;
}

export function RegulationPanel({ regulations, onScan, isLoading }: Props) {
  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h3>⚖️ RegGuard — Compliance Scan</h3>
        <button onClick={onScan} disabled={isLoading} style={styles.btn}>
          {isLoading ? 'Scanning...' : 'Re-Scan Compliance'}
        </button>
      </div>

      <div style={styles.list}>
        {regulations.length === 0 ? (
          <div style={styles.empty}>No regulations scanned yet. Build a workflow and click re-scan.</div>
        ) : (
          regulations.map((reg, i) => (
            <div key={i} style={{ ...styles.card, ...getSeverityStyle(reg.severity) }}>
              <div style={styles.cardHeader}>
                <span style={styles.name}>{reg.regulation}</span>
                <span style={styles.region}>({reg.region})</span>
                <span style={{ ...styles.status, ...(reg.compliant ? styles.statusOk : styles.statusBad) }}>
                  {reg.compliant ? 'COMPLIANT' : 'VIOLATION'}
                </span>
              </div>
              <p style={styles.desc}>{reg.description}</p>
              {reg.fix && (
                <div style={styles.fixWrap}>
                  <div style={styles.fixTitle}>💡 Claude's Recommended Fix:</div>
                  <div style={styles.fixText}>{reg.fix}</div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function getSeverityStyle(sev: string): React.CSSProperties {
  switch (sev) {
    case 'high': return { borderLeft: '4px solid #f44336' };
    case 'medium': return { borderLeft: '4px solid #f9ab00' };
    case 'low': return { borderLeft: '4px solid #1a73e8' };
    default: return {};
  }
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
  cardHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 },
  name: { fontWeight: 700, fontSize: 14 },
  region: { fontSize: 11, opacity: 0.6 },
  status: { fontSize: 9, padding: '2px 6px', borderRadius: 4, fontWeight: 800, marginLeft: 'auto' },
  statusOk: { background: '#34a85322', color: '#34a853' },
  statusBad: { background: '#f4433622', color: '#f44336' },
  desc: { fontSize: 12, opacity: 0.8, lineHeight: 1.5, marginBottom: 12 },
  fixWrap: {
    background: 'rgba(255,255,255,0.05)', padding: 12, borderRadius: 4,
    border: '1px dashed rgba(255,255,255,0.1)'
  },
  fixTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4, color: '#f9ab00' },
  fixText: { fontSize: 12, fontStyle: 'italic', opacity: 0.9 },
  btn: {
    padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
    background: '#00d4ff', border: 'none', color: '#000', fontWeight: 600
  },
  empty: { opacity: 0.5, textAlign: 'center', marginTop: 100 }
};
