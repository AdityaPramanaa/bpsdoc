<?php
// Script pengecekan environment dan dependensi utama project
header('Content-Type: text/plain');

// 1. Cek versi PHP
printf("PHP Version: %s\n", phpversion());

// 2. Cek apakah composer.json ada
if (file_exists(__DIR__ . '/composer.json')) {
    echo "composer.json: ADA\n";
} else {
    echo "composer.json: TIDAK ADA\n";
}

// 3. Cek apakah vendor/autoload.php ada
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    echo "vendor/autoload.php: ADA\n";
    require_once __DIR__ . '/vendor/autoload.php';
} else {
    echo "vendor/autoload.php: TIDAK ADA\n";
}

// 4. Cek apakah Cloudinary\Uploader tersedia
if (class_exists('Cloudinary\\Uploader')) {
    echo "Cloudinary\\Uploader: TERSEDIA\n";
} else {
    echo "Cloudinary\\Uploader: TIDAK TERSEDIA\n";
}

// 5. Cek file Cloudinary Uploader
if (file_exists(__DIR__ . '/vendor/cloudinary/cloudinary_php/src/Uploader.php')) {
    echo "vendor/cloudinary/cloudinary_php/src/Uploader.php: ADA\n";
} else {
    echo "vendor/cloudinary/cloudinary_php/src/Uploader.php: TIDAK ADA\n";
}

// 6. Cek user dan permission
if (function_exists('posix_getpwuid')) {
    $user = posix_getpwuid(posix_geteuid());
    echo "User PHP: ".$user['name']."\n";
} else {
    echo "User PHP: (tidak bisa dideteksi di Windows)\n";
}

// 7. Cek extension penting
$ext = ['curl', 'json', 'mbstring', 'fileinfo'];
foreach ($ext as $e) {
    echo sprintf("Ekstensi %s: %s\n", $e, extension_loaded($e) ? 'AKTIF' : 'TIDAK AKTIF');
}

// 8. Cek versi composer (jika bisa)
$composer = shell_exec('composer --version');
echo "Composer CLI: ".($composer ? trim($composer) : 'TIDAK TERDETEKSI')."\n";

// 9. Cek versi node (jika bisa)
$node = shell_exec('node --version');
echo "Node.js CLI: ".($node ? trim($node) : 'TIDAK TERDETEKSI')."\n";

// 10. Cek versi npm (jika bisa)
$npm = shell_exec('npm --version');
echo "npm CLI: ".($npm ? trim($npm) : 'TIDAK TERDETEKSI')."\n";

// 11. Cek file .env
if (file_exists(__DIR__ . '/.env')) {
    echo ".env: ADA\n";
} else {
    echo ".env: TIDAK ADA\n";
}

// 12. Cek file cloudinary_config.php
if (file_exists(__DIR__ . '/cloudinary_config.php')) {
    echo "cloudinary_config.php: ADA\n";
} else {
    echo "cloudinary_config.php: TIDAK ADA\n";
}

// 13. Cek folder public
if (is_dir(__DIR__ . '/public')) {
    echo "public/: ADA\n";
} else {
    echo "public/: TIDAK ADA\n";
}

// 14. Cek folder src
if (is_dir(__DIR__ . '/src')) {
    echo "src/: ADA\n";
} else {
    echo "src/: TIDAK ADA\n";
}

// 15. Cek folder node_modules
if (is_dir(__DIR__ . '/node_modules')) {
    echo "node_modules/: ADA\n";
} else {
    echo "node_modules/: TIDAK ADA\n";
}

// 16. Cek folder vendor
if (is_dir(__DIR__ . '/vendor')) {
    echo "vendor/: ADA\n";
} else {
    echo "vendor/: TIDAK ADA\n";
}

// 17. Tampilkan semua class yang sudah dideklarasikan
// echo "\nClass yang ter-load:\n";
// print_r(get_declared_classes()); 