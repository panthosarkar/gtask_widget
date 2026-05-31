import { app, BrowserWindow, ipcMain } from "electron";
import { promises as fs } from "node:fs";
import {
  createServer,
  type IncomingMessage,
  type ServerResponse,
} from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";

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
let rendererServer: ReturnType<typeof createServer> | null = null;

const LOCAL_RENDERER_ORIGIN = "http://127.0.0.1:4173";

type WindowState = {
  width: number;
  height: number;
};

const DEFAULT_WINDOW_STATE: WindowState = {
  width: 420,
  height: 680,
};

function getWindowStateFile() {
  return path.join(app.getPath("userData"), "window-state.json");
}

async function loadWindowState(): Promise<WindowState> {
  try {
    const content = await fs.readFile(getWindowStateFile(), "utf-8");
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
  const windowStateFile = getWindowStateFile();

  await fs.mkdir(path.dirname(windowStateFile), { recursive: true });
  await fs.writeFile(
    windowStateFile,
    JSON.stringify({ width, height }, null, 2),
    "utf-8",
  );
}

function getContentType(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case ".html":
      return "text/html; charset=utf-8";
    case ".js":
      return "application/javascript; charset=utf-8";
    case ".mjs":
      return "application/javascript; charset=utf-8";
    case ".css":
      return "text/css; charset=utf-8";
    case ".svg":
      return "image/svg+xml";
    case ".json":
      return "application/json; charset=utf-8";
    case ".png":
      return "image/png";
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".ico":
      return "image/x-icon";
    default:
      return "application/octet-stream";
  }
}

async function startLocalRendererServer() {
  if (VITE_DEV_SERVER_URL || rendererServer) {
    return;
  }

  rendererServer = createServer(
    async (req: IncomingMessage, res: ServerResponse) => {
      try {
        const requestUrl = new URL(req.url ?? "/", LOCAL_RENDERER_ORIGIN);
        const requestPath = decodeURIComponent(requestUrl.pathname);

        const relativePath =
          requestPath === "/" ? "index.html" : requestPath.slice(1);
        const filePath = path.join(RENDERER_DIST, relativePath);

        let targetPath = filePath;
        try {
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            targetPath = path.join(filePath, "index.html");
          }
        } catch {
          targetPath = path.join(RENDERER_DIST, "index.html");
        }

        const content = await fs.readFile(targetPath);
        res.statusCode = 200;
        res.setHeader("Content-Type", getContentType(targetPath));
        res.end(content);
      } catch {
        try {
          const content = await fs.readFile(
            path.join(RENDERER_DIST, "index.html"),
          );
          res.statusCode = 200;
          res.setHeader("Content-Type", "text/html; charset=utf-8");
          res.end(content);
        } catch {
          res.statusCode = 500;
          res.end("Unable to load app");
        }
      }
    },
  );

  await new Promise<void>((resolve, reject) => {
    rendererServer?.once("error", reject);
    rendererServer?.listen(4173, "127.0.0.1", () => resolve());
  });
}

async function createWindow() {
  const windowState = await loadWindowState();

  app.setName("Google Task Widget");

  win = new BrowserWindow({
    width: windowState.width,
    height: windowState.height,
    title: "Google Task Widget",
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

  ipcMain.removeHandler("window-controls:get-state");
  ipcMain.removeHandler("window-controls:set-pinned");
  ipcMain.removeHandler("window-controls:set-always-on-top");
  ipcMain.removeHandler("window-controls:minimize");
  ipcMain.removeHandler("window-controls:toggle-maximize");
  ipcMain.removeHandler("window-controls:close");

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

  ipcMain.handle(
    "open-task-window",
    (_event, opts: { mode: string; taskListId?: string; taskId?: string }) => {
      const modal = new BrowserWindow({
        parent: win ?? undefined,
        modal: true,
        width: 480,
        height: 420,
        title: "Google Task Widget",
        useContentSize: true,
        show: false,
        resizable: false,
        frame: false,
        webPreferences: {
          preload: path.join(__dirname, "preload.mjs"),
        },
      });

      const qs = new URLSearchParams();
      qs.set("taskModal", "1");
      qs.set("mode", opts.mode ?? "add");
      if (opts.taskListId) qs.set("taskListId", opts.taskListId);
      if (opts.taskId) qs.set("taskId", opts.taskId);

      const urlWithQuery = VITE_DEV_SERVER_URL
        ? `${VITE_DEV_SERVER_URL}?${qs.toString()}`
        : `${LOCAL_RENDERER_ORIGIN}?${qs.toString()}`;

      modal.loadURL(urlWithQuery);

      // Show window only when content is ready to avoid flicker/resizing.
      const tryShow = () => {
        if (modal && !modal.isDestroyed()) {
          modal.show();
          modal.focus();
        }
      };

      // Prefer ready-to-show, fallback to did-finish-load.
      modal.once("ready-to-show", tryShow);
      modal.webContents.once("did-finish-load", () => {
        // In some dev setups ready-to-show may not fire — ensure we show then.
        if (!modal.isVisible()) tryShow();
      });

      return true;
    },
  );

  setWindowPinned(false);

  // Test active push message to Renderer-process.
  win.webContents.on("did-finish-load", () => {
    win?.webContents.send("main-process-message", new Date().toLocaleString());
  });

  win.on("resize", () => {
    void saveWindowState();
  });
  win.on("close", () => {
    void saveWindowState();
  });

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.once("did-finish-load", () => {
      win?.webContents.openDevTools({ mode: "detach" });
    });
  } else {
    win.loadURL(LOCAL_RENDERER_ORIGIN);
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    rendererServer?.close();
    rendererServer = null;
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

app.whenReady().then(async () => {
  await startLocalRendererServer();
  await createWindow();
});
