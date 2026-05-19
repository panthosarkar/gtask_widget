import { app as a, BrowserWindow as h, ipcMain as i } from "electron";
import { promises as m } from "node:fs";
import { fileURLToPath as z } from "node:url";
import o from "node:path";
const u = o.dirname(z(import.meta.url));
process.env.APP_ROOT = o.join(u, "..");
const c = process.env.VITE_DEV_SERVER_URL, M = o.join(process.env.APP_ROOT, "dist-electron"), p = o.join(process.env.APP_ROOT, "dist");
process.env.VITE_PUBLIC = c ? o.join(process.env.APP_ROOT, "public") : p;
let e;
const d = {
  width: 420,
  height: 680
};
function g() {
  return o.join(a.getPath("userData"), "window-state.json");
}
async function v() {
  try {
    const r = await m.readFile(g(), "utf-8"), n = JSON.parse(r);
    return {
      width: Number.isFinite(n.width) ? Math.max(320, Math.round(n.width)) : d.width,
      height: Number.isFinite(n.height) ? Math.max(240, Math.round(n.height)) : d.height
    };
  } catch {
    return d;
  }
}
async function w() {
  if (!e || e.isDestroyed())
    return;
  const { width: r, height: n } = e.getBounds(), s = g();
  await m.mkdir(o.dirname(s), { recursive: !0 }), await m.writeFile(
    s,
    JSON.stringify({ width: r, height: n }, null, 2),
    "utf-8"
  );
}
async function f() {
  const r = await v();
  e = new h({
    width: r.width,
    height: r.height,
    minWidth: 320,
    minHeight: 240,
    frame: !1,
    icon: o.join(process.env.VITE_PUBLIC, "electron-vite.svg"),
    webPreferences: {
      preload: o.join(u, "preload.mjs")
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
    (t, l) => s.setPinned(l)
  ), i.handle(
    "window-controls:set-always-on-top",
    (t, l) => s.setAlwaysOnTop(l)
  ), i.handle("window-controls:minimize", () => s.minimize()), i.handle(
    "window-controls:toggle-maximize",
    () => s.toggleMaximize()
  ), i.handle("window-controls:close", () => s.close()), n(!1), e.webContents.on("did-finish-load", () => {
    e == null || e.webContents.send("main-process-message", (/* @__PURE__ */ new Date()).toLocaleString());
  }), e.on("resize", () => {
    w();
  }), e.on("close", () => {
    w();
  }), c ? e.loadURL(c) : e.loadFile(o.join(p, "index.html"));
}
a.on("window-all-closed", () => {
  process.platform !== "darwin" && (a.quit(), e = null);
});
a.on("activate", () => {
  h.getAllWindows().length === 0 && f();
});
a.whenReady().then(f);
export {
  M as MAIN_DIST,
  p as RENDERER_DIST,
  c as VITE_DEV_SERVER_URL
};
