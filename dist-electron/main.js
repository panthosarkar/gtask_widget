import { app as c, BrowserWindow as h, ipcMain as i } from "electron";
import { promises as u } from "node:fs";
import { fileURLToPath as b } from "node:url";
import o from "node:path";
const f = o.dirname(b(import.meta.url));
process.env.APP_ROOT = o.join(f, "..");
const m = process.env.VITE_DEV_SERVER_URL, M = o.join(process.env.APP_ROOT, "dist-electron"), g = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = m ? o.join(process.env.APP_ROOT, "public") : g;
let e;
const w = {
  width: 420,
  height: 680
};
function z() {
  return o.join(c.getPath("userData"), "window-state.json");
}
async function x() {
  try {
    const d = await u.readFile(z(), "utf-8"), n = JSON.parse(d);
    return {
      width: Number.isFinite(n.width) ? Math.max(320, Math.round(n.width)) : w.width,
      height: Number.isFinite(n.height) ? Math.max(240, Math.round(n.height)) : w.height
    };
  } catch {
    return w;
  }
}
async function v() {
  if (!e || e.isDestroyed())
    return;
  const { width: d, height: n } = e.getBounds(), s = z();
  await u.mkdir(o.dirname(s), { recursive: !0 }), await u.writeFile(
    s,
    JSON.stringify({ width: d, height: n }, null, 2),
    "utf-8"
  );
}
async function _() {
  const d = await x();
  e = new h({
    width: d.width,
    height: d.height,
    minWidth: 320,
    minHeight: 240,
    frame: !1,
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(f, "preload.mjs")
    }
  });
  const n = (t) => {
    !e || e.isDestroyed() || (e.setMovable(!t), e.setResizable(!t), e.setMinimizable(!t), e.setMaximizable(!t));
  }, s = {
    getState: () => ({
      pinned: !(e != null && e.isMovable()),
      alwaysOnTop: !!(e != null && e.isAlwaysOnTop()),
      maximized: !!(e != null && e.isMaximized())
    }),
    setPinned: (t) => (n(t), { pinned: t }),
    setAlwaysOnTop: (t) => (e == null || e.setAlwaysOnTop(t), { alwaysOnTop: t }),
    minimize: () => e != null && e.isMinimizable() ? (e.minimize(), { minimized: !0 }) : { minimized: !1 },
    toggleMaximize: () => e != null && e.isMaximizable() ? e.isMaximized() ? (e.unmaximize(), { maximized: !1 }) : (e.maximize(), { maximized: !0 }) : { maximized: !1 },
    close: () => (e == null || e.close(), { closed: !0 })
  };
  i.removeHandler("window-controls:get-state"), i.removeHandler("window-controls:set-pinned"), i.removeHandler("window-controls:set-always-on-top"), i.removeHandler("window-controls:minimize"), i.removeHandler("window-controls:toggle-maximize"), i.removeHandler("window-controls:close"), i.handle("window-controls:get-state", () => s.getState()), i.handle(
    "window-controls:set-pinned",
    (t, a) => s.setPinned(a)
  ), i.handle(
    "window-controls:set-always-on-top",
    (t, a) => s.setAlwaysOnTop(a)
  ), i.handle("window-controls:minimize", () => s.minimize()), i.handle(
    "window-controls:toggle-maximize",
    () => s.toggleMaximize()
  ), i.handle("window-controls:close", () => s.close()), i.handle(
    "open-task-window",
    (t, a) => {
      const r = new h({
        parent: e ?? void 0,
        modal: !0,
        width: 480,
        height: 420,
        useContentSize: !0,
        show: !1,
        resizable: !1,
        frame: !1,
        webPreferences: {
          preload: o.join(f, "preload.mjs")
        }
      }), l = new URLSearchParams();
      l.set("taskModal", "1"), l.set("mode", a.mode ?? "add"), a.taskListId && l.set("taskListId", a.taskListId), a.taskId && l.set("taskId", a.taskId);
      const S = m ? `${m}?${l.toString()}` : `file://${o.join(g, "index.html")}?${l.toString()}`;
      r.loadURL(S);
      const p = () => {
        r && !r.isDestroyed() && (r.show(), r.focus());
      };
      return r.once("ready-to-show", p), r.webContents.once("did-finish-load", () => {
        r.isVisible() || p();
      }), !0;
    }
  ), n(!1), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), e.on("resize", () => {
    v();
  }), e.on("close", () => {
    v();
  }), m ? (e.loadURL(m), e.webContents.once("did-finish-load", () => {
    e == null || e.webContents.openDevTools({ mode: "detach" });
  })) : e.loadFile(o.join(g, "index.html"));
}
c.on("window-all-closed", () => {
  process.platform !== "darwin" && (c.quit(), e = null);
});
c.on("activate", () => {
  h.getAllWindows().length === 0 && _();
});
c.whenReady().then(_);
export {
  M as MAIN_DIST,
  g as RENDERER_DIST,
  m as VITE_DEV_SERVER_URL
};
