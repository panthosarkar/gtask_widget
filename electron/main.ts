import { app, BrowserWindow, ipcMain } from "electron";
// import { createRequire } from "node:module";
import { promises as fs } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

// const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, "..");

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
export const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL
  ? path.join(process.env.APP_ROOT, "public")
  : RENDERER_DIST;

let win: BrowserWindow | null;

type WindowState = {
  width: number;
  height: number;
};

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 420,
  height: 680,
};

const WINDOW_STATE_FILE = path.join(
  app.getPath("userData"),
  "window-state.json",
);

async function loadWindowState(): Promise<WindowState> {
  try {
    const content = await fs.readFile(WINDOW_STATE_FILE, "utf-8");
    const parsed = JSON.parse(content) as Partial<WindowState>;

    return {
      width: Number.isFinite(parsed.width)
        ? Math.max(320, Math.round(parsed.width!))
        : DEFAULT_WINDOW_STATE.width,
      height: Number.isFinite(parsed.height)
        ? Math.max(240, Math.round(parsed.height!))
        : DEFAULT_WINDOW_STATE.height,
    };
  } catch {
    return DEFAULT_WINDOW_STATE;
  }
}

async function saveWindowState() {
  if (!win || win.isDestroyed()) {
    return;
  }

  const { width, height } = win.getBounds();

  await fs.mkdir(path.dirname(WINDOW_STATE_FILE), { recursive: true });
  await fs.writeFile(
    WINDOW_STATE_FILE,
    JSON.stringify({ width, height }, null, 2),
    "utf-8",
  );
}

async function createWindow() {
  const windowState = await loadWindowState();

  win = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    minWidth: 320,
    minHeight: 240,
    frame: false,
    icon: path.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  const setWindowPinned = (pinned: boolean) => {
    if (!win || win.isDestroyed()) {
      return;
    }

    win.setMovable(!pinned);
    win.setResizable(!pinned);
    win.setMinimizable(!pinned);
    win.setMaximizable(!pinned);
  };

  const windowControls = {
    getState: () => ({
      pinned: !win?.isMovable(),
      alwaysOnTop: !!win?.isAlwaysOnTop(),
      maximized: !!win?.isMaximized(),
    }),
    setPinned: (pinned: boolean) => {
      setWindowPinned(pinned);
      return { pinned };
    },
    setAlwaysOnTop: (alwaysOnTop: boolean) => {
      win?.setAlwaysOnTop(alwaysOnTop);
      return { alwaysOnTop };
    },
    minimize: () => {
      if (!win?.isMinimizable()) {
        return { minimized: false };
      }

      win.minimize();
      return { minimized: true };
    },
    toggleMaximize: () => {
      if (!win?.isMaximizable()) {
        return { maximized: false };
      }

      if (win.isMaximized()) {
        win.unmaximize();
        return { maximized: false };
      }

      win.maximize();
      return { maximized: true };
    },
    close: () => {
      win?.close();
      return { closed: true };
    },
  };

  ipcMain.handle("window-controls:get-state", () => windowControls.getState());
  ipcMain.handle("window-controls:set-pinned", (_event, pinned: boolean) =>
    windowControls.setPinned(pinned),
  );
  ipcMain.handle(
    "window-controls:set-always-on-top",
    (_event, alwaysOnTop: boolean) =>
      windowControls.setAlwaysOnTop(alwaysOnTop),
  );
  ipcMain.handle("window-controls:minimize", () => windowControls.minimize());
  ipcMain.handle("window-controls:toggle-maximize", () =>
    windowControls.toggleMaximize(),
  );
  ipcMain.handle("window-controls:close", () => windowControls.close());

  setWindowPinned(false);

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  win.on("resize", saveWindowState);
  win.on("close", saveWindowState);

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});

app.on("activate", () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);
