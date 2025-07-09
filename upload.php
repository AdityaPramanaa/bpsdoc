<?php
require 'cloudinary_config.php';
require 'vendor/autoload.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file'];
    try {
        $cloudinary = new \Cloudinary\Cloudinary();
        $result = $cloudinary->uploadApi()->upload($file['tmp_name'], [
            'resource_type' => 'auto',
            'folder' => 'bps',
            'use_filename' => true,
            'unique_filename' => false
        ]);
        echo json_encode(['success' => true, 'url' => $result['secure_url'], 'public_id' => $result['public_id']]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
}
?> 