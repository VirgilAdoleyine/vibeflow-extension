import React, { useState } from 'react';

interface Props {
  onSubmit: (prompt: string) => void;
  isLoading: boolean;
}

export function CommandBar({ onSubmit, isLoading }: Props) {
  const [prompt, setPrompt] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt);
      setPrompt('');
    }
  };

  return (
    <div style={styles.container}>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe your workflow in plain English..."
          style={styles.input}
          disabled={isLoading}
        />
        <button type="submit" style={styles.button} disabled={isLoading || !prompt.trim()}>
          {isLoading ? '⚡' : 'Build'}
        </button>
      </form>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '12px 16px',
    background: 'var(--vscode-sideBar-background)',
    borderBottom: '1px solid var(--vscode-panel-border)'
  },
  form: { display: 'flex', gap: 8 },
  input: {
    flex: 1,
    padding: '8px 12px',
    borderRadius: 4,
    border: '1px solid var(--vscode-input-border)',
    background: 'var(--vscode-input-background)',
    color: 'var(--vscode-input-foreground)',
    outline: 'none',
    fontSize: 13
  },
  button: {
    padding: '0 16px',
    borderRadius: 4,
    border: 'none',
    background: '#00d4ff',
    color: '#000',
    fontWeight: 600,
    cursor: 'pointer',
    opacity: 0.9
  }
};
