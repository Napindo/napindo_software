"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("ipcRenderer", {
  on(...args) {
    const [channel, listener] = args;
    return electron.ipcRenderer.on(channel, (event, ...args2) => listener(event, ...args2));
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
electron.contextBridge.exposeInMainWorld("database", {
  testConnection: () => electron.ipcRenderer.invoke("db:testConnection"),
  fetchTableData: (tableName) => electron.ipcRenderer.invoke("db:fetchTableData", tableName),
  fetchExhibitors: (segment, limit = 200) => electron.ipcRenderer.invoke("db:fetchExhibitors", segment, limit),
  login: (payload) => electron.ipcRenderer.invoke("db:login", payload),
  userHints: () => electron.ipcRenderer.invoke("db:userHints")
});
