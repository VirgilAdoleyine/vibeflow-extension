# ⚡ VibeFlow Capabilities & Features (CAP.md)

VibeFlow is an AI-native VS Code extension designed to democratize automation by allowing developers to build, run, and self-heal complex Python workflows using natural language.

---

## 🚀 Core Workflows

### 1. Natural Language to DAG (Planner)
- **Input:** Plain English descriptions (e.g., "Every morning, summarize my unread Gmails and post them to Slack").
- **Process:** Claude 3.5/Sonnet (via OpenRouter) decomposes the prompt into a structured Directed Acyclic Graph (DAG).
- **Output:** A visual workflow representation with specific node types (Trigger, Action, LLM, Code, etc.).

### 2. Autonomous Code Generation (Executor)
- **Process:** Each node in the workflow graph is translated into production-ready Python 3.11 code.
- **Standards:** Uses standard libraries or pip-installable packages, loading secrets securely from `.env`.

### 3. Infinite Self-Healing (Reflector)
- **Capability:** If the generated code fails (syntax errors, runtime exceptions), the Reflector node (Claude) automatically analyzes the error and patches the code.
- **Workflow:** Runs in a loop (`maxRetries = Infinity`) until the code executes successfully or the user intervenes.

---

## 🧠 Advanced AI Capabilities

### 🔎 Smart Model Discovery
- **Engine:** Powered by `perplexity/sonar-deep-research` via OpenRouter.
- **Feature:** Analyzes the user's specific automation task and searches the OpenRouter catalog to recommend the TOP 5 most appropriate AI models based on strengths (reasoning, speed, tool-use).

### ⚖️ RegGuard: Global Compliance Scanning
- **Engine:** Dual-engine scan using Perplexity (Global) + x-ai Grok-4 (Trending/New).
- **Scope:** Checks workflows against GDPR (EU), CCPA (CA), HIPAA (USA), PDPA (Ghana), SOC2, and the EU AI Act.
- **Claude Patches:** For non-compliant workflows, Claude provides 1-2 sentence code-level fixes to ensure legal safety before deployment.

---

## 🛠️ Technical Features

### 🎨 Visual Node Canvas
- **Technology:** Built with React Flow.
- **Interaction:** Fully interactive canvas to visualize the AI's plan, adjust node positions, and monitor execution paths.
- **In-Canvas Execution:** Run workflows directly from the extension UI with real-time status updates. No manual script running required.
- **Live Node Editing:** Click any node to open a context-aware editor. Customize logic, app integrations, and parameters on the fly.
- **Composio Integration:** Built-in shortcut to set up and manage 400+ third-party app connections.

### 📁 Production-Ready File Generation
- **Automated Directory:** Creates `workflows/<workflow_name>_<timestamp>/`.
- **Package:** Generates:
    - `agent.py`: The full AI agent script.
    - `.env.local`: Pre-filled template with `VIBEFLOW_` prefixed keys.
    - `README.md`: Customized setup instructions and project documentation.

### 🔀 Dual-Remote Git Sync
- **Capability:** Built-in Git helper to synchronize code across two remotes simultaneously (`origin` for cloud/personal and `community` for the VibeFlow open-source repo).
- **Workflow:** Handles remote creation, multi-pull, and multi-push in a single command.

---

## 🔑 Integration Ecosystem

- **OpenRouter:** Single gateway for Claude, Gemini, Perplexity, and Grok.
- **E2B:** Integrated sandbox support for safe code execution.
- **Composio:** Access to 400+ OAuth integrations (Gmail, Slack, GitHub, Notion).
- **Database/Caching:** Built-in support for Neon Postgres and Upstash Redis.
- **Scheduling:** Native integration with Inngest for event-driven workflows.

---

**Built with ❤️ by Virgil Junior Adoleyine 🇬🇭**
*Empowering developers to build the future of automation.*
