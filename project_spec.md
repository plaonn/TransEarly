# TransEarly - BYOK Chrome Translation Extension

## 1. Project Overview
- **Objective**: Develop a Bring Your Own Key (BYOK) Chrome translation extension using the Google Translate API.
- **Tech Stack**: Vite, TypeScript, Chrome Extension Manifest V3.
- **Key Features**: In-place text translation, style cloning, DOM tree traversal, dynamic content handling via MutationObserver, API request batching.

## 2. Architecture & Components

### 2.1 Manifest V3 (`manifest.json`)
- **Permissions**: `storage`, `activeTab`, `scripting`.
- **Host Permissions**: `<all_urls>` (for fetching cross-origin APIs or translating pages).
- **Background**: `background.ts` (Service Worker).
- **Content Scripts**: `content.ts` (DOM modification).
- **Options Page**: `options.html`, `options.ts` (API Key configuration).

### 2.2 Storage Manager (`chrome.storage.sync`)
- Save and load the Google Translate API key.

### 2.3 Background Service Worker (`background.ts`)
- Listens for messages from `content.ts`.
- Batches and forwards translation requests to the Google Translate API.
- Manages rate limiting or fetch execution.
- Returns translated strings to the content script.

### 2.4 Content Script (`content.ts`)
- **DOM Parsing**: Uses `TreeWalker` to extract text nodes within block elements.
- **Style Cloning**: Extracts text style via `window.getComputedStyle()` (font, color, margin, etc.).
- **Rendering Engine**: Creates translation nodes with `border: 1px dashed rgba(0,0,0,0.3)` and specific classes to differentiate from original text.
- **Dynamic Content**: Monitors DOM changes via `MutationObserver` to translate dynamically loaded content (SPA support).
- **Batching**: Collects multiple text nodes and sends a batched request to `background.ts`.

## 3. Directory Structure
```
.
├── index.html        # Vite placeholder (unused)
├── manifest.json     # Chrome extension manifest
├── package.json      # Dependencies and scripts
├── project_spec.md   # System spec & tracking (this file)
├── src/
│   ├── background.ts # Background worker
│   ├── content.ts    # Content script
│   ├── options.ts    # Options logic
│   └── options.html  # Options UI
├── tsconfig.json     # TypeScript configuration
└── vite.config.ts    # Vite configuration for building extension
```

## 4. State Tracking
- [x] Create project_spec.md
- [ ] Initialize Vite + TS project
- [ ] Setup manifest.json and Options
- [ ] Setup Background messaging
- [ ] Setup Content Script logic
