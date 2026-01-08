# Developer Guide

Dokumentasi ini ditujukan untuk programmer yang mengembangkan atau memelihara Napindo Software. Tujuannya memberi gambaran arsitektur dan alur kode secara ringkas namun lengkap.

## Gambaran Arsitektur
- Renderer (UI): React + Vite di `src/`.
- Main process Electron: di `electron/` (window, ipc, preload).
- Backend API: Express + Prisma di `api/` (service terpisah).
- Database: PostgreSQL (konfigurasi di `api/.env`).
- Reporting: jsreport untuk export dokumen.

## Struktur Folder Utama
- `src/`: UI/renderer React.
- `src/pages/`: Halaman aplikasi (Add Data, Search, Report, dll).
- `src/components/`: Komponen UI reusable (Sidebar, ComboField, dll).
- `src/services/`: Wrapper akses data lewat Electron bridge atau API.
- `src/store/`: Zustand store untuk state global.
- `src/utils/`: Helper (akses/role, string, dsb).
- `src/constants/`: Data statis (options combo, provinces, mapping flag).
- `electron/`: Main process, preload, IPC handlers.
- `api/`: Backend API + Prisma.

## Autentikasi dan Akses
Logika akses ada di `src/utils/access.ts`.
- Admin: username yang masuk `fullAccessUsers`.
- RND: division `rnd`.
- Limited: default untuk user lainnya.

Hak akses menentukan:
- Halaman yang muncul di Sidebar (lihat `src/components/Sidebar.tsx`).
- Aksi khusus seperti import, delete, view log, dan search data.

## Navigasi Halaman
`src/pages/Dashboard.tsx` merender halaman aktif dari `useAppStore`.
Sidebar memfilter menu berdasarkan `access.allowedPages`.

## Add Data Flow (Data utama)
File utama: `src/pages/AddData.tsx`.
- Form dikontrol oleh state lokal `form`.
- Validasi minimal karakter di `minLengths`.
- Required field di `requiredFields`.
- Opsi multi-select berasal dari `src/constants/addDataOptions.ts`.

Simulasi alur:
1. User isi form.
2. `buildPayload()` membentuk data sesuai kebutuhan backend.
3. `saveAddData()` atau `updateAddData()` dipanggil dari `src/services/addData.ts`.
4. Audit log dicatat via `src/services/audit.ts` (best-effort).

Search (inline edit) di Add Data:
- `listGabungRecords()` menampilkan tabel gabungan.
- Edit per baris menggunakan `updateAddData()`.

## Search Flow (Exhibitor/Visitor)
File: `src/pages/Exhibitor.tsx` dan `src/pages/Visitor.tsx`.
- Load data, pilih baris, klik Edit.
- Data dipush ke `AddData` via `addDataDraft` di store.
- `AddDataHub` membuka `AddData` dengan `initialRow` + `initialId`.

## Role-Based Sidebar
File: `src/components/Sidebar.tsx`.
- Menu dikunci berdasarkan `access.allowedPages`.
- Group menu (Input Data, Search, Print Label, Report).

## Services Layer
Folder: `src/services/`.
Tujuan: mengabstraksi akses data agar renderer tidak langsung memanggil IPC.
Contoh:
- `addData.ts`: save/update/delete/lookup.
- `pengguna.ts`: CRUD user dan autentikasi.
- `report*.ts`, `printLabel.ts`: export dokumen.

Umumnya service akan:
1. Cek `window.database` (preload).
2. Fallback ke `ipcRenderer.invoke`.
3. Throw error jika bridge tidak tersedia.

## State Management
`src/store/appStore.ts` menggunakan Zustand:
- `user`, `activePage`, `addDataDraft`, `globalMessage`.
- Digunakan oleh Sidebar, Dashboard, dan halaman utama.

## Audit Logging
`src/services/audit.ts` dipanggil setelah aksi penting (search, add, update).
Kegagalan logging tidak memblokir flow utama.

## Data Konfigurasi Statis
- `src/constants/addDataOptions.ts`: opsi combo (Business, Visitor, dll).
- `src/constants/flagMaps.ts`: mapping label ke kode flag.
- `src/constants/provinces.ts`: daftar province/city.

## Testing & Validation
Tidak ada test runner eksplisit di repo ini.
Validasi utama dilakukan di UI (Add Data) sebelum submit.

## Dokumen Terkait
- Flow Admin: `docs/ADMIN_FLOW.md`
- Flow User: `docs/USER_FLOW.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
