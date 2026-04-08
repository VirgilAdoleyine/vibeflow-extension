# VibeFlow Deployment Guide: VS Code Marketplace & Open VSX

This guide provides step-by-step instructions to package and publish the **VibeFlow** extension to the official VS Code Marketplace and the Open VSX Registry.

---

## 📦 Prerequisites

1.  **Install vsce:** The Visual Studio Code Extension Manager.
    ```bash
    npm install -g @vscode/vsce
    ```
2.  **Install ovsx:** The Open VSX Registry CLI.
    ```bash
    npm install -g ovsx
    ```

---

## 🛠️ Step 1: Prepare the Extension

Ensure the extension is fully built and ready for production.

1.  **Install all dependencies:**
    ```bash
    npm install
    cd webview && npm install && cd ..
    ```
2.  **Run the production build:**
    This script bundles both the extension backend (esbuild) and the webview (Vite).
    ```bash
    npm run build
    ```

---

## 🚀 Step 2: Publish to VS Code Marketplace

You can publish using the CLI (requires a PAT) or via the web portal (no PAT required).

### Option A: Web Portal Upload (Recommended - No PAT Required)

1.  **Generate the Package:**
    ```bash
    npx vsce package
    ```
    This creates a `vibeflow-1.0.0.vsix` file in your project root.
2.  **Go to the Management Portal:**
    Open the [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
3.  **Create/Select Publisher:**
    Create a publisher with the ID `VirgilAdoleyine` if you haven't already.
4.  **Upload:**
    - Click on the **"New Extension"** button.
    - Select **"Visual Studio Code"**.
    - Drag and drop your `.vsix` file or browse to select it.
    - Click **"Upload"**.

### Option B: CLI Publish (Requires PAT)

1.  **Create a Personal Access Token (PAT):**
    - Sign in to [Azure DevOps](https://dev.azure.com/).
    - Create a PAT with **Organization:** "All accessible organizations" and **Scopes:** "Marketplace (Manage)".
2.  **Login & Publish:**
    ```bash
    # Login with your publisher ID and PAT
    npx vsce login VirgilAdoleyine

    # Package and publish
    npx vsce publish
    ```

---

## 🌐 Step 3: Publish to Open VSX (Eclipse Foundation)

Open VSX powers alternative editors like VSCodium and Gitpod.

### 1. Create an Account
- Sign in to [Open VSX](https://open-vsx.org/).
- Go to **Settings -> Access Tokens** and generate a new token.

### 2. Publish
Use the `.vsix` file generated in the previous step.
```bash
# Publish using your token and the generated .vsix file
ovsx publish vibeflow-1.0.0.vsix -p <YOUR_OPEN_VSX_TOKEN>
```

---

## 💡 Troubleshooting & Tips

-   **Version Bump:** Remember to update the `version` in `package.json` before every new release.
-   **Icon:** Ensure `media/icon.png` exists; it is the face of your extension on the store.
-   **README:** The marketplace uses your `README.md` as the main landing page. Keep it updated!
-   **Verification:** After publishing, it may take a few minutes for the extension to appear in search results.

---

**Built by Virgil Junior Adoleyine 🇬🇭**
*Empowering developers to deploy faster with compliant AI automation.*
