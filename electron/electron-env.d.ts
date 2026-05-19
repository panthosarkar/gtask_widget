/// <reference types="vite-plugin-electron/electron-env" />

declare namespace NodeJS {
  interface ProcessEnv {
    /**
     * The built directory structure
     *
     * ```tree
     * ├─┬─┬ dist
     * │ │ └── index.html
     * │ │
     * │ ├─┬ dist-electron
     * │ │ ├── main.js
     * │ │ └── preload.js
     * │
     * ```
     */
    APP_ROOT: string;
    /** /dist/ or /public/ */
    VITE_PUBLIC: string;
  }
}

// Used in Renderer process, expose in `preload.ts`
interface Window {
  ipcRenderer: import("electron").IpcRenderer;
  windowControls: {
    getState: () => Promise<{
      pinned: boolean;
      alwaysOnTop: boolean;
      maximized: boolean;
    }>;
    setPinned: (pinned: boolean) => Promise<{ pinned: boolean }>;
    setAlwaysOnTop: (alwaysOnTop: boolean) => Promise<{ alwaysOnTop: boolean }>;
    minimize: () => Promise<{ minimized: boolean }>;
    toggleMaximize: () => Promise<{ maximized: boolean }>;
    close: () => Promise<{ closed: boolean }>;
  };
}
