# Napindo Software

Aplikasi desktop (Electron + React) untuk input data, pencarian, report, dan print label. Backend API terpisah di folder `api/` dengan database dan jsreport untuk generate dokumen.

## Prasyarat
- Node.js + npm
- Database (PostgreSQL sesuai `DATABASE_URL`)
- jsreport server (untuk export dokumen)

## Struktur Repo
- `src/` UI renderer (React + Vite)
- `electron/` main process + preload
- `api/` backend service (Express + Prisma)

## Konfigurasi Environment

Root app:
- Salin `.env.example` menjadi `.env`
- Isi nilai berikut:
  - `API_BASE_URL` contoh: `http://<api-host>:<port>`
  - `API_PREFIX` contoh: `/api`

API server (`api/.env`):
- `PORT` contoh: `<port>`
- `DATABASE_URL` contoh: `postgresql://USER:PASSWORD@HOST:5432/DB?schema=public`
- `JSREPORT_URL` contoh: `http://<jsreport-host>:<port>`
- `JSREPORT_USER` contoh: `admin`
- `JSREPORT_PASSWORD` contoh: `password`

Catatan: jika jsreport memakai config khusus, lihat `api/jsreport.config.json`.

## Menjalankan Backend (API)
```bash
cd api
npm install
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

## Menjalankan UI (Renderer)
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

Build Windows (semua arsitektur):
```bash
npm run build:win:all
```

## Lint
```bash
npm run lint
```

## Troubleshooting
- UI tidak bisa akses API: cek `API_BASE_URL` di `.env`, pastikan API sudah running di `PORT` yang sama.
- Gagal generate report/label: pastikan `JSREPORT_URL`, `JSREPORT_USER`, `JSREPORT_PASSWORD` di `api/.env` benar dan jsreport server aktif.
- Error Prisma/DB: cek `DATABASE_URL`, pastikan database up dan schema sudah migrate (`npm run prisma:migrate`).
- Electron tidak load UI: pastikan `npm run dev` (renderer) berjalan dan tidak ada error di terminal.

## Dokumentasi
- Developer Guide: `docs/DEVELOPER_GUIDE.md`
- Flow Admin: `docs/ADMIN_FLOW.md`
- Flow User: `docs/USER_FLOW.md`
- Troubleshooting: `docs/TROUBLESHOOTING.md`
