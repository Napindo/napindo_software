"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("database", {
  testConnection: () => electron.ipcRenderer.invoke("db:testConnection"),
  fetchTableData: (tableName) => electron.ipcRenderer.invoke("db:fetchTableData", tableName),
  fetchExhibitors: (segment, limit = 200, person = "exhibitor") => electron.ipcRenderer.invoke("db:fetchExhibitors", segment, limit, person),
  login: (payload) => electron.ipcRenderer.invoke("db:login", payload),
  userHints: () => electron.ipcRenderer.invoke("db:userHints"),
  findCompany: (company) => electron.ipcRenderer.invoke("db:findCompany", company),
  saveAddData: (payload) => electron.ipcRenderer.invoke("db:saveAddData", payload),
  updateAddData: (id, payload) => electron.ipcRenderer.invoke("db:updateAddData", id, payload),
  deleteAddData: (ids) => electron.ipcRenderer.invoke("db:deleteAddData", ids),
  reportLabelVisitor: (filter) => electron.ipcRenderer.invoke("report:labelvisitor", filter),
  reportLabelGover: (filter) => electron.ipcRenderer.invoke("report:labelgover", filter)
});
