# Troubleshooting

Dokumentasi ini berisi langkah cepat untuk masalah umum dan konfigurasi tambahan.

## Tambah opsi Business (dropdown Add Data)
Sumber data opsi Business ada di `src/constants/addDataOptions.ts`.

Langkah:
1. Buka `src/constants/addDataOptions.ts`.
2. Cari `comboOptions.business`.
3. Tambahkan item baru ke array tersebut (gunakan Title Case agar konsisten).
4. Simpan perubahan dan jalankan ulang aplikasi.

Catatan:
- Jika ada opsi yang tidak muncul, pastikan tidak ada duplikasi atau typo.

## Menjadikan user sebagai Admin
Daftar Admin hardcoded ada di `src/utils/access.ts` dalam `fullAccessUsers`.

Langkah:
1. Buka `src/utils/access.ts`.
2. Tambahkan username ke `fullAccessUsers`.
3. Simpan perubahan dan jalankan ulang aplikasi.

Contoh:
```ts
const fullAccessUsers = new Set(['anton', 'sandi', 'zidan', 'fajrin', 'namauserbaru'])
```

Catatan:
- Username disimpan dalam bentuk lowercase dan dibandingkan secara case-insensitive.

## UI tidak bisa akses API
- Pastikan `API_BASE_URL` di `.env` sudah benar.
- Pastikan backend API sedang berjalan.

## Gagal generate report/label
- Periksa konfigurasi `JSREPORT_URL`, `JSREPORT_USER`, `JSREPORT_PASSWORD` di `api/.env`.
- Pastikan jsreport server aktif.

## Error Prisma/DB
- Periksa `DATABASE_URL` di `api/.env`.
- Pastikan database aktif dan migrasi sudah dijalankan.

## Electron tidak load UI
- Pastikan `npm run dev` (renderer) berjalan tanpa error.
