import React, { useEffect, useRef } from 'react';

interface Log {
  text: string;
  stage: string;
  time: string;
}

interface Props {
  logs: Log[];
}

export function StatusFeed({ logs }: Props) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div style={styles.container}>
      {logs.length === 0 ? (
        <div style={styles.empty}>System idle</div>
      ) : (
        logs.map((log, i) => (
          <div key={i} style={styles.log}>
            <span style={styles.time}>{log.time}</span>
            <span style={{ ...styles.stage, ...getStageStyle(log.stage) }}>[{log.stage}]</span>
            <span style={styles.text}>{log.text}</span>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

function getStageStyle(stage: string): React.CSSProperties {
  switch (stage) {
    case 'planner': return { color: '#00d4ff' };
    case 'executor': return { color: '#34a853' };
    case 'healer': return { color: '#e64a19' };
    case 'complete': return { color: '#f9ab00' };
    case 'error': return { color: '#f44336' };
    default: return { color: 'var(--vscode-editor-foreground)' };
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    height: 120,
    background: 'var(--vscode-editor-background)',
    borderTop: '1px solid var(--vscode-panel-border)',
    overflowY: 'auto',
    padding: '8px 16px',
    fontSize: 11,
    fontFamily: 'var(--vscode-editor-font-family, monospace)'
  },
  log: { marginBottom: 4, display: 'flex', gap: 8 },
  time: { opacity: 0.4 },
  stage: { fontWeight: 700, minWidth: 70 },
  text: { opacity: 0.9 },
  empty: { opacity: 0.3, textAlign: 'center', marginTop: 40 }
};
