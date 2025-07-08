-- Jalankan ini setelah membuat tabel users di database bps_dokumen
-- Password di-hash menggunakan PHP password_hash
INSERT INTO users (username, password, role) VALUES (
  'bpsprov',
  '$2y$10$Qw6Qw6Qw6Qw6Qw6Qw6Qw6uQw6Qw6Qw6Qw6Qw6Qw6Qw6Qw6Qw6Qw6',
  'admin'
);
-- Gantilah hash password di atas dengan hasil dari password_hash('@bps2025', PASSWORD_DEFAULT) di PHP 