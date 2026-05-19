"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(
      channel,
      (event, ...args2) => listener(event, ...args2)
    );
  },
  off(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.off(channel, ...omit);
  },
  send(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.send(channel, ...omit);
  },
  invoke(...args) {
    const [channel, ...omit] = args;
    return electron.ipcRenderer.invoke(channel, ...omit);
  }
  // You can expose other APTs you need here.
  // ...
});
electron.contextBridge.exposeInMainWorld("windowControls", {
  getState: () => electron.ipcRenderer.invoke("window-controls:get-state"),
  setPinned: (pinned) => electron.ipcRenderer.invoke("window-controls:set-pinned", pinned),
  setAlwaysOnTop: (alwaysOnTop) => electron.ipcRenderer.invoke(
    "window-controls:set-always-on-top",
    alwaysOnTop
  ),
  minimize: () => electron.ipcRenderer.invoke("window-controls:minimize"),
  toggleMaximize: () => electron.ipcRenderer.invoke("window-controls:toggle-maximize"),
  close: () => electron.ipcRenderer.invoke("window-controls:close")
});
