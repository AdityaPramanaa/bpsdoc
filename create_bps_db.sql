-- Buat database
CREATE DATABASE IF NOT EXISTS bps_dokumen DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE bps_dokumen;

-- Tabel users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabel documents
CREATE TABLE IF NOT EXISTS documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    type ENUM('pdf', 'excel') NOT NULL,
    size BIGINT,
    upload_date DATETIME,
    public_id VARCHAR(255),
    created_by INT,
    FOREIGN KEY (created_by) REFERENCES users(id)
); 