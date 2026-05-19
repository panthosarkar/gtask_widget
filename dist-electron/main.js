import { app, BrowserWindow, ipcMain } from "electron";
import { promises } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const __dirname$1 = path.dirname(fileURLToPath(import.meta.url));
process.env.APP_ROOT = path.join(__dirname$1, "..");
const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
const MAIN_DIST = path.join(process.env.APP_ROOT, "dist-electron");
const RENDERER_DIST = path.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, "public") : RENDERER_DIST;
let win;
const DEFAULT_WINDOW_STATE = {
  width: 420,
  height: 680
};
const WINDOW_STATE_FILE = path.join(
  app.getPath("userData"),
  "window-state.json"
);
async function loadWindowState() {
  try {
    const content = await promises.readFile(WINDOW_STATE_FILE, "utf-8");
    const parsed = JSON.parse(content);
    return {
      width: Number.isFinite(parsed.width) ? Math.max(320, Math.round(parsed.width)) : DEFAULT_WINDOW_STATE.width,
      height: Number.isFinite(parsed.height) ? Math.max(240, Math.round(parsed.height)) : DEFAULT_WINDOW_STATE.height
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
  await promises.mkdir(path.dirname(WINDOW_STATE_FILE), { recursive: true });
  await promises.writeFile(
    WINDOW_STATE_FILE,
    JSON.stringify({ width, height }, null, 2),
    "utf-8"
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
      preload: path.join(__dirname$1, "preload.mjs")
    }
  });
  const setWindowPinned = (pinned) => {
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
      pinned: !(win == null ? void 0 : win.isMovable()),
      alwaysOnTop: !!(win == null ? void 0 : win.isAlwaysOnTop()),
      maximized: !!(win == null ? void 0 : win.isMaximized())
    }),
    setPinned: (pinned) => {
      setWindowPinned(pinned);
      return { pinned };
    },
    setAlwaysOnTop: (alwaysOnTop) => {
      win == null ? void 0 : win.setAlwaysOnTop(alwaysOnTop);
      return { alwaysOnTop };
    },
    minimize: () => {
      if (!(win == null ? void 0 : win.isMinimizable())) {
        return { minimized: false };
      }
      win.minimize();
      return { minimized: true };
    },
    toggleMaximize: () => {
      if (!(win == null ? void 0 : win.isMaximizable())) {
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
      win == null ? void 0 : win.close();
      return { closed: true };
    }
  };
  ipcMain.handle("window-controls:get-state", () => windowControls.getState());
  ipcMain.handle(
    "window-controls:set-pinned",
    (_event, pinned) => windowControls.setPinned(pinned)
  );
  ipcMain.handle(
    "window-controls:set-always-on-top",
    (_event, alwaysOnTop) => windowControls.setAlwaysOnTop(alwaysOnTop)
  );
  ipcMain.handle("window-controls:minimize", () => windowControls.minimize());
  ipcMain.handle(
    "window-controls:toggle-maximize",
    () => windowControls.toggleMaximize()
  );
  ipcMain.handle("window-controls:close", () => windowControls.close());
  setWindowPinned(false);
  win.webContents.on("did-finish-load", () => {
    win == null ? void 0 : win.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  });
  win.on("resize", saveWindowState);
  win.on("close", saveWindowState);
  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
  } else {
    win.loadFile(path.join(RENDERER_DIST, "index.html"));
  }
}
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
    win = null;
  }
});
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
app.whenReady().then(createWindow);
export {
  MAIN_DIST,
  RENDERER_DIST,
  VITE_DEV_SERVER_URL
};
