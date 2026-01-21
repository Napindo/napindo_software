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

## Catatan Print Label
- Template label disetel untuk ukuran kertas A4.
- Pastikan printer default atau opsi print menggunakan ukuran A4 dan skala 100% (Actual size) agar layout label tidak berubah.

## Auto Update (LAN/Offline)
Mode ini memakai server lokal (LAN) untuk menyajikan file update agar client bisa auto‑update tanpa internet.

### Server LAN
1. Siapkan web server sederhana di PC server (contoh: `http://192.168.1.86:8080/updates`).
2. Folder `updates` harus berisi file hasil build:
   - `latest.yml`
   - `Napindo Visitor Software 2 Ver X.Y.Z-Windows-Setup.exe`
   - (opsional) `*.blockmap`
3. Pastikan semua client bisa akses URL tersebut lewat browser.

### Mengaktifkan Web Server (CMD)
Contoh menjalankan web server dari folder `E:\updates`:
```cmd
cd /d E:\updates
python -m http.server 8080
```
Setelah aktif, akses `http://192.168.1.86:8080/` dari client.

### Build & Publish
1. Build installer:
```bash
npm run build:win:all
```
2. Upload hasil build ke folder `updates` di server LAN.

### Copy cepat dari release ke updates (CMD)
Gunakan skrip CMD yang sudah disediakan:
```cmd
cd /d E:\Zidan\Software\napindo_software
scripts\publish-updates.cmd
```
Jika folder updates berbeda:
```cmd
scripts\publish-updates.cmd E:\updates
```

### Perilaku Update
- Aplikasi cek update saat startup dan tiap 6 jam.
- Update diunduh otomatis dan dipasang saat aplikasi ditutup (silent).

## Build & Release
Release versi terbaru (otomatis bump patch version di `package.json`):
```bash
npm run build:win:all
```

## Menjalankan API dan jsreport
1. Siapkan environment API:
   - Copy `api/.env.example` ke `api/.env` lalu sesuaikan `DATABASE_URL` dan `JSREPORT_URL`.
2. Jalankan API (dev):
```bash
cd api
npm install
npm run dev
```
3. Jalankan jsreport:
```bash
cd api
npx jsreport start --config jsreport.config.json
```
Catatan:
- Default jsreport berjalan di port `9133` (lihat `api/jsreport.config.json`).
- Pastikan `JSREPORT_URL` di `api/.env` mengarah ke alamat jsreport yang aktif.
- Auth jsreport default nonaktif. Jika diaktifkan di `api/jsreport.config.json`, set `JSREPORT_USER` dan `JSREPORT_PASSWORD` agar render/report tidak gagal.

## Dokumen Terkait
- Flow Admin: `docs/ADMIN_FLOW.md`
- Flow User: `docs/USER_FLOW.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
