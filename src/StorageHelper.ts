import fetch from 'node-fetch';

export class StorageHelper {
  // NEON POSTGRES (via HTTP API)
  static async saveWorkflow(url: string, workflow: any): Promise<void> {
    if (!url) return;
    try {
      // Note: This uses Neon's SQL exec endpoint
      const response = await fetch(`${url}/sql`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `INSERT INTO workflows (description, nodes, edges, created_at) VALUES ($1, $2, $3, NOW())`,
          params: [
            workflow.description,
            JSON.stringify(workflow.nodes),
            JSON.stringify(workflow.edges)
          ]
        })
      });
      if (!response.ok) console.error('Neon storage failed:', await response.text());
    } catch (e) {
      console.error('Storage error:', e);
    }
  }

  // UPSTASH REDIS (via HTTP REST API)
  static async cacheResult(url: string, token: string, key: string, value: any): Promise<void> {
    if (!url || !token) return;
    try {
      const response = await fetch(`${url}/set/${key}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(value)
      });
      if (!response.ok) console.error('Upstash cache failed:', await response.text());
    } catch (e) {
      console.error('Cache error:', e);
    }
  }

  static async getCache(url: string, token: string, key: string): Promise<any | null> {
    if (!url || !token) return null;
    try {
      const response = await fetch(`${url}/get/${key}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data: any = await response.json();
      return data.result ? JSON.parse(data.result) : null;
    } catch {
      return null;
    }
  }
}
