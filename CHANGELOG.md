# Changelog

All notable changes to the "VibeFlow Orch" extension will be documented in this file.

## [2.0.9] - 2026-04-09
- Updated webview UI with NodeEditor for editing node code and config
- Click any node to view/edit Python code and credentials
- Self-healing loop runs up to 5 attempts when nodes fail on E2B
- Each workflow node now has generated code attached
- StorageHelper for saving workflows to Neon Postgres + Upstash Redis
- Env vars from VS Code settings pre-filled in generated .env.local

## [2.0.8] - 2026-04-09
- Each node now has AI-generated Python code
- Self-healing loop - auto-fixes failed code up to 5 times
- Run workflow directly on E2B without generating files first
- New updateNodeData and getNodeCode commands
- PostHog telemetry for anonymous usage analytics

## [2.0.7] - 2026-04-09
- Generate Files now pre-fills all API keys from settings
- customEnvVars setting for additional env var names
- Run Generated Files on E2B button

## [2.0.6] - 2026-04-09
- E2B integration for running Python code in sandbox
- Each step runs on E2B cloud sandbox

## [2.0.5] - 2026-04-09
- Better directory structure when generating files
- Individual step_1.py, step_2.py files
- requirements.txt generated

## [2.0.4] - 2026-04-09
- Fixed config key from vibeflow to vibeflow-orch

## [2.0.3] - 2026-04-09
- Config fix for vibeflow-orch settings

## [2.0.2] - 2026-04-09
- Config key fix

## [2.0.1] - 2026-04-09
- Package name change to vibeflow-orch

## [2.0.0] - 2026-04-08
- Major version bump for marketplace

## [1.0.0] - 2026-04-07
- Initial release of VibeFlow.
- AI Workflow Builder with Planner, Executor, Reflector, and Formatter nodes.
- Perplexity integration for model search and regulation scanning.
- React Flow visual canvas.
- Python workflow generation.
- Dual-remote git synchronization.
