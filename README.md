# Git Diff Flex

A Chrome extension that adds a draggable pane bezel between two files when comparing diffs on GitHub.

## Support
If you like my work and wish to show your appreciation, you can [buy me a coffee!](https://buymeacoffee.com/pbarnum)

## Tech Stack

- **TypeScript** - Type-safe development
- **React** - Modern UI components
- **Material-UI (MUI)** - Material Design component library
- **Webpack** - Module bundling

## Project Structure

```
git-diff-flex/
├── src/
│   ├── background/          # Background service worker
│   │   └── index.ts
│   ├── content/             # Content script (injected into GitHub pages)
│   │   ├── index.ts
│   │   ├── ConfigManager.ts
│   │   ├── HandleManager.ts
│   │   ├── DOMUtils.ts
│   │   └── styles.css
│   ├── options/             # Options page (React)
│   │   ├── index.tsx
│   │   ├── App.tsx
│   │   └── index.html
│   └── types/               # Shared TypeScript types
│       └── index.ts
├── dist/                    # Build output (generated)
├── manifest.json            # Chrome extension manifest
├── package.json
├── tsconfig.json
├── webpack.config.js
└── .eslintrc.json
```

## Development

### Install Dependencies

```bash
npm install
```

### Build for Development (with watch mode)

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

### Type Checking

```bash
npm run type-check
```

### Linting

```bash
npm run lint
```

## Loading the Extension

1. Run `npm run build` to create the `dist/` folder
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist/` folder

## Features

- **Draggable Split View**: Drag the bezel to adjust the view between deletions and additions
- **Toggle Buttons**: Quick buttons to switch between viewing deletions, additions, or split view
- **Word Wrap**: Optional word wrapping for code blocks
- **Modern Architecture**: Built with TypeScript, React, and styled-components
- **Type Safety**: Full TypeScript coverage with Chrome API types

## Development Notes

### Architecture Overview

- **Background Script**: Handles extension lifecycle and declarative content rules
- **Content Script**: Injected into GitHub pages to add the draggable split functionality
  - `ConfigManager`: Manages user preferences
  - `HandleManager`: Handles drag interactions and button toggles
  - `DOMUtils`: Utility functions for DOM calculations
- **Options Page**: React-based settings interface with Material-UI components
