# BPS Project

## Deskripsi
Project ini merupakan aplikasi berbasis React (TypeScript) untuk frontend dan PHP untuk backend, dengan integrasi Cloudinary untuk manajemen file.

## Struktur Project
- `src/` : Source code frontend (React + TypeScript)
- `vendor/` : Dependensi PHP (hasil composer install)
- `node_modules/` : Dependensi frontend (hasil npm install)
- `cloudinary_config.php` : Konfigurasi Cloudinary
- `upload.php`, `delete.php`, `list_files.php` : Endpoint PHP untuk upload, hapus, dan list file

## Cara Menjalankan
1. Install dependensi backend:
   ```bash
   composer install
   ```
2. Install dependensi frontend:
   ```bash
   npm install
   ```
3. Jalankan frontend (Vite):
   ```bash
   npm run dev
   ```
4. Jalankan backend (PHP):
   - Pastikan server (misal: Laragon/XAMPP) sudah aktif

## Konfigurasi
- Pastikan file `cloudinary_config.php` sudah diisi dengan kredensial Cloudinary Anda.
- Jika butuh environment variable, buat file `.env` di root.

## Catatan
- Folder `public/` tidak ditemukan, pastikan aset statis diletakkan di tempat yang sesuai jika dibutuhkan.
- Dokumentasi lebih lanjut dapat ditambahkan sesuai kebutuhan. 