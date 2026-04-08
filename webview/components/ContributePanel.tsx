interface Props { vscode: { postMessage: (m: any) => void } }

export function ContributePanel({ vscode }: Props) {
  const open = (url: string) => vscode.postMessage({ command: 'openExternal', url });

  return (
    <div style={{ padding: 24, overflowY: 'auto', height: '100%' }}>
      <h2 style={{ color: '#00d4ff', marginBottom: 4 }}>⭐ Contribute & Community</h2>
      <p style={{ opacity: 0.7, fontSize: 12, marginBottom: 20 }}>
        VibeFlow is built by Virgil Junior Adoleyine, 17, 🇬🇭 Ghana. Help us grow.
      </p>

      {/* VibeFlow Cloud */}
      <Section title="☁️ VibeFlow Cloud" color="#00d4ff">
        <p>Get the full visual canvas, 400+ integrations, execution history, and more.</p>
        <Btn label="Open vibeflow-cloud.vercel.app" onClick={() => open('https://vibeflow-cloud.vercel.app')} />
      </Section>

      {/* Community Repo */}
      <Section title="🛠️ Developer / Self-Hosting" color="#34a853">
        <p>Fork, contribute, or self-host VibeFlow. Use the dual-remote workflow:</p>
        <Code>{`# Pull from both repos
git pull origin main && git pull community main

# Push to both repos
git push origin main && git push community main

# Or do both at once
git pull origin main && git pull community main && \
git push origin main && git push community main`}</Code>
        <Btn label="Community Repo on GitHub" onClick={() => open('https://github.com/VirgilAdoleyine/vibeflow')} />
      </Section>

      {/* RegGuard */}
      <Section title="🛡️ RegGuard — Compliance for Devs" color="#f9ab00">
        <p>
          RegGuard is a VS Code extension that helps developers ship compliant code faster.
          Built by the same author. <strong>148+ downloads</strong> already.
        </p>
        <p style={{ fontSize: 12, opacity: 0.8 }}>
          Search <strong>"RegGuard"</strong> on the VS Code Marketplace or Open VSX.
          ⭐ Star the repo to help it grow and support developers worldwide.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Btn label="⭐ Star RegGuard on GitHub" onClick={() => open('https://github.com/VirgilAdoleyine/regguard')} />
          <Btn label="Download on Marketplace" onClick={() => open('https://marketplace.visualstudio.com/items?itemName=VirgilAdoleyine.regguard')} secondary />
          <Btn label="Open VSX" onClick={() => open('https://open-vsx.org/extension/VirgilAdoleyine/regguard')} secondary />
        </div>
      </Section>

      {/* Non-coders */}
      <Section title="👥 Non-Coders Welcome" color="#9c27b0">
        <p>
          Can't code? No problem. Use VibeFlow Cloud's visual UI to build, run, and share workflows —
          no code required. Contribute workflows to the community.
        </p>
        <Btn label="Go to VibeFlow Cloud" onClick={() => open('https://vibeflow-cloud.vercel.app')} />
      </Section>
    </div>
  );
}

function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 24, padding: 16, borderRadius: 8, border: `1px solid ${color}22`, background: `${color}08` }}>
      <h3 style={{ color, marginTop: 0, marginBottom: 10, fontSize: 13 }}>{title}</h3>
      <div style={{ fontSize: 12, lineHeight: 1.6 }}>{children}</div>
    </div>
  );
}

function Btn({ label, onClick, secondary }: { label: string; onClick: () => void; secondary?: boolean }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 4, cursor: 'pointer', fontSize: 12,
      border: secondary ? '1px solid var(--vscode-panel-border)' : 'none',
      background: secondary ? 'transparent' : '#00d4ff',
      color: secondary ? 'var(--vscode-editor-foreground)' : '#000',
      fontWeight: 600, marginTop: 8
    }}>{label}</button>
  );
}

function Code({ children }: { children: string }) {
  return (
    <pre style={{
      background: 'var(--vscode-textCodeBlock-background)',
      padding: 12, borderRadius: 4, fontSize: 11,
      overflowX: 'auto', lineHeight: 1.5, margin: '8px 0'
    }}>{children}</pre>
  );
}
