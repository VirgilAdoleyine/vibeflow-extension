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

### 1. Create a Microsoft Account & Azure DevOps Org
- Sign in to [Azure DevOps](https://dev.azure.com/).
- Create a **Personal Access Token (PAT)**:
    - **Organization:** All accessible organizations.
    - **Scopes:** Custom defined -> Marketplace (Manage).
    - **Copy the PAT!** You will need it in the next step.

### 2. Create a Publisher
- Go to the [Visual Studio Marketplace Management Portal](https://marketplace.visualstudio.com/manage).
- Create a publisher with the ID `VirgilAdoleyine` (as defined in `package.json`).

### 3. Login & Publish
```bash
# Login with your publisher ID and PAT
vsce login VirgilAdoleyine

# Package the extension into a .vsix file
vsce package

# Publish to the marketplace
vsce publish
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
