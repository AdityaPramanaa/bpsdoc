<?php
require 'cloudinary_config.php';
require 'vendor/autoload.php';

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

$input = json_decode(file_get_contents('php://input'), true);
$public_id = $input['public_id'] ?? '';

if ($public_id) {
    try {
        $cloudinary = new \Cloudinary\Cloudinary();
        $cloudinary->uploadApi()->destroy($public_id, [
            'resource_type' => 'auto'
        ]);
        echo json_encode(['success' => true]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'No public_id provided']);
}
?> 