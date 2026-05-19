import { ipcRenderer, contextBridge } from "electron";

type WindowState = {
  pinned: boolean;
  alwaysOnTop: boolean;
  maximized: boolean;
};

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args;
    return ipcRenderer.on(channel, (event, ...args) =>
      listener(event, ...args),
    );
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args;
    return ipcRenderer.off(channel, ...omit);
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args;
    return ipcRenderer.send(channel, ...omit);
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args;
    return ipcRenderer.invoke(channel, ...omit);
  },

  // You can expose other APTs you need here.
  // ...
});

contextBridge.exposeInMainWorld("windowControls", {
  getState: () =>
    ipcRenderer.invoke("window-controls:get-state") as Promise<WindowState>,
  setPinned: (pinned: boolean) =>
    ipcRenderer.invoke("window-controls:set-pinned", pinned) as Promise<{
      pinned: boolean;
    }>,
  setAlwaysOnTop: (alwaysOnTop: boolean) =>
    ipcRenderer.invoke(
      "window-controls:set-always-on-top",
      alwaysOnTop,
    ) as Promise<{ alwaysOnTop: boolean }>,
  minimize: () =>
    ipcRenderer.invoke("window-controls:minimize") as Promise<{
      minimized: boolean;
    }>,
  toggleMaximize: () =>
    ipcRenderer.invoke("window-controls:toggle-maximize") as Promise<{
      maximized: boolean;
    }>,
  close: () =>
    ipcRenderer.invoke("window-controls:close") as Promise<{ closed: boolean }>,
});
