import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("database", {
  // dY"1 Test koneksi API
  testConnection: () => ipcRenderer.invoke("db:testConnection"),

  // dY"1 Ambil data tabel (GABUNG / PENGGUNA)
  fetchTableData: (tableName: string) =>
    ipcRenderer.invoke("db:fetchTableData", tableName),

  // dY"1 Ambil exhibitor/visitor berdasarkan segment (defence, water, livestock, dll)
  fetchExhibitors: (
    segment: string,
    limit = 200,
    person: "exhibitor" | "visitor" = "exhibitor",
  ) => ipcRenderer.invoke("db:fetchExhibitors", segment, limit, person),

  // dY"1 Login user
  login: (payload: { username: string; password: string; division?: string | null }) =>
    ipcRenderer.invoke("db:login", payload),

  // dY"1 Ambil hint user (daftar username & division)
  userHints: () => ipcRenderer.invoke("db:userHints"),

  // dY"1 Cari perusahaan (COMPANY LIKE %keyword%)
  findCompany: (company: string) =>
    ipcRenderer.invoke("db:findCompany", company),

  // dY"1 Simpan data baru ke GABUNG
  saveAddData: (payload: any) =>
    ipcRenderer.invoke("db:saveAddData", payload),

  // dY"1 Update data GABUNG berdasarkan NOURUT
  updateAddData: (id: string | number, payload: any) =>
    ipcRenderer.invoke("db:updateAddData", id, payload),

  // dY"1 Hapus data GABUNG berdasarkan NOURUT (bisa banyak)
  deleteAddData: (ids: Array<string | number>) =>
    ipcRenderer.invoke("db:deleteAddData", ids),
});

// Jika suatu hari nanti kamu ingin re-enable report, tempatkan di sini:
// reportLabelVisitor: (filter) => ipcRenderer.invoke("report:labelvisitor", filter),
// reportLabelGover: (filter) => ipcRenderer.invoke("report:labelgover", filter),
// reportBusinessVisitor: (filter) => ipcRenderer.invoke("report:businessvisitor", filter),
// dst.
