import { app as w, BrowserWindow as v, ipcMain as s } from "electron";
import { promises as h } from "node:fs";
import { createServer as j } from "node:http";
import { fileURLToPath as P } from "node:url";
import o from "node:path";
const x = o.dirname(P(import.meta.url));
process.env.APP_ROOT = o.join(x, "..");
const m = process.env.VITE_DEV_SERVER_URL, S = o.join(process.env.APP_ROOT, "dist-electron"), u = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = m ? o.join(process.env.APP_ROOT, "public") : u;
let e, l = null;
const y = "http://127.0.0.1:4173", g = {
  width: 420,
  height: 680
};
function R() {
  return o.join(w.getPath("userData"), "window-state.json");
}
async function _() {
  try {
    const a = await h.readFile(R(), "utf-8"), t = JSON.parse(a);
    return {
      width: Number.isFinite(t.width) ? Math.max(320, Math.round(t.width)) : g.width,
      height: Number.isFinite(t.height) ? Math.max(240, Math.round(t.height)) : g.height
    };
  } catch {
    return g;
  }
}
async function z() {
  if (!e || e.isDestroyed())
    return;
  const { width: a, height: t } = e.getBounds(), i = R();
  await h.mkdir(o.dirname(i), { recursive: !0 }), await h.writeFile(
    i,
    JSON.stringify({ width: a, height: t }, null, 2),
    "utf-8"
  );
}
function b(a) {
  switch (o.extname(a).toLowerCase()) {
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
async function I() {
  m || l || (l = j(
    async (a, t) => {
      try {
        const i = new URL(a.url ?? "/", y), n = decodeURIComponent(i.pathname), d = n === "/" ? "index.html" : n.slice(1), r = o.join(u, d);
        let c = r;
        try {
          (await h.stat(r)).isDirectory() && (c = o.join(r, "index.html"));
        } catch {
          c = o.join(u, "index.html");
        }
        const p = await h.readFile(c);
        t.statusCode = 200, t.setHeader("Content-Type", b(c)), t.end(p);
      } catch {
        try {
          const i = await h.readFile(
            o.join(u, "index.html")
          );
          t.statusCode = 200, t.setHeader("Content-Type", "text/html; charset=utf-8"), t.end(i);
        } catch {
          t.statusCode = 500, t.end("Unable to load app");
        }
      }
    }
  ), await new Promise((a, t) => {
    l == null || l.once("error", t), l == null || l.listen(4173, "127.0.0.1", () => a());
  }));
}
async function T() {
  const a = await _();
  w.setName("Google Task Widget"), e = new v({
    width: a.width,
    height: a.height,
    title: "Google Task Widget",
    minWidth: 320,
    minHeight: 240,
    frame: !1,
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(x, "preload.mjs")
    }
  });
  const t = (n) => {
    !e || e.isDestroyed() || (e.setMovable(!n), e.setResizable(!n), e.setMinimizable(!n), e.setMaximizable(!n));
  }, i = {
    getState: () => ({
      pinned: !(e != null && e.isMovable()),
      alwaysOnTop: !!(e != null && e.isAlwaysOnTop()),
      maximized: !!(e != null && e.isMaximized())
    }),
    setPinned: (n) => (t(n), { pinned: n }),
    setAlwaysOnTop: (n) => (e == null || e.setAlwaysOnTop(n), { alwaysOnTop: n }),
    minimize: () => e != null && e.isMinimizable() ? (e.minimize(), { minimized: !0 }) : { minimized: !1 },
    toggleMaximize: () => e != null && e.isMaximizable() ? e.isMaximized() ? (e.unmaximize(), { maximized: !1 }) : (e.maximize(), { maximized: !0 }) : { maximized: !1 },
    close: () => (e == null || e.close(), { closed: !0 })
  };
  s.removeHandler("window-controls:get-state"), s.removeHandler("window-controls:set-pinned"), s.removeHandler("window-controls:set-always-on-top"), s.removeHandler("window-controls:minimize"), s.removeHandler("window-controls:toggle-maximize"), s.removeHandler("window-controls:close"), s.handle("window-controls:get-state", () => i.getState()), s.handle(
    "window-controls:set-pinned",
    (n, d) => i.setPinned(d)
  ), s.handle(
    "window-controls:set-always-on-top",
    (n, d) => i.setAlwaysOnTop(d)
  ), s.handle("window-controls:minimize", () => i.minimize()), s.handle(
    "window-controls:toggle-maximize",
    () => i.toggleMaximize()
  ), s.handle("window-controls:close", () => i.close()), s.handle(
    "open-task-window",
    (n, d) => {
      const r = new v({
        parent: e ?? void 0,
        modal: !0,
        width: 480,
        height: 420,
        title: "Google Task Widget",
        useContentSize: !0,
        show: !1,
        resizable: !1,
        frame: !1,
        webPreferences: {
          preload: o.join(x, "preload.mjs")
        }
      }), c = new URLSearchParams();
      c.set("taskModal", "1"), c.set("mode", d.mode ?? "add"), d.taskListId && c.set("taskListId", d.taskListId), d.taskId && c.set("taskId", d.taskId);
      const p = m ? `${m}?${c.toString()}` : `${y}?${c.toString()}`;
      r.loadURL(p);
      const f = () => {
        r && !r.isDestroyed() && (r.show(), r.focus());
      };
      return r.once("ready-to-show", f), r.webContents.once("did-finish-load", () => {
        r.isVisible() || f();
      }), !0;
    }
  ), t(!1), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), e.on("resize", () => {
    z();
  }), e.on("close", () => {
    z();
  }), m ? (e.loadURL(m), e.webContents.once("did-finish-load", () => {
    e == null || e.webContents.openDevTools({ mode: "detach" });
  })) : e.loadURL(y);
}
w.on("window-all-closed", () => {
  process.platform !== "darwin" && (l == null || l.close(), l = null, w.quit(), e = null);
});
w.on("activate", () => {
  v.getAllWindows().length === 0 && T();
});
w.whenReady().then(async () => {
  await I(), await T();
});
export {
  S as MAIN_DIST,
  u as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
