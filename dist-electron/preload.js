"use strict";
const electron = require("electron");
electron.contextBridge.exposeInMainWorld("database", {
  // dY"1 Test koneksi API
  testConnection: () => electron.ipcRenderer.invoke("db:testConnection"),
  // dY"1 Ambil data tabel (GABUNG / PENGGUNA)
  fetchTableData: (tableName) => electron.ipcRenderer.invoke("db:fetchTableData", tableName),
  // dY"1 Ambil exhibitor/visitor berdasarkan segment (defence, water, livestock, dll)
  fetchExhibitors: (segment, limit = 200, person = "exhibitor") => electron.ipcRenderer.invoke("db:fetchExhibitors", segment, limit, person),
  // dY"1 Login user
  login: (payload) => electron.ipcRenderer.invoke("db:login", payload),
  // dY"1 Ambil hint user (daftar username & division)
  userHints: () => electron.ipcRenderer.invoke("db:userHints"),
  // dY"1 Cari perusahaan (COMPANY LIKE %keyword%)
  findCompany: (company) => electron.ipcRenderer.invoke("db:findCompany", company),
  // dY"1 Simpan data baru ke GABUNG
  saveAddData: (payload) => electron.ipcRenderer.invoke("db:saveAddData", payload),
  // dY"1 Update data GABUNG berdasarkan NOURUT
  updateAddData: (id, payload) => electron.ipcRenderer.invoke("db:updateAddData", id, payload),
  // dY"1 Hapus data GABUNG berdasarkan NOURUT (bisa banyak)
  deleteAddData: (ids) => electron.ipcRenderer.invoke("db:deleteAddData", ids)
});
