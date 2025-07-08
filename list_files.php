<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');

require 'cloudinary_config.php';

$api = new \Cloudinary\Api\Admin\AdminApi();
try {
    $resultRaw = $api->assets(['resource_type' => 'raw', 'max_results' => 100]);
    $resultImage = $api->assets(['resource_type' => 'image', 'max_results' => 100]);
    $allResources = array_merge($resultRaw['resources'], $resultImage['resources']);
    $files = array_map(function($item) {
        $format = isset($item['format']) && $item['format'] ? $item['format'] : strtolower(pathinfo($item['public_id'], PATHINFO_EXTENSION));
        $original_filename = isset($item['filename']) && $item['filename'] ? $item['filename'] : (isset($item['original_filename']) && $item['original_filename'] ? $item['original_filename'] : pathinfo($item['public_id'], PATHINFO_FILENAME));
        return [
            'public_id' => $item['public_id'],
            'url' => $item['secure_url'],
            'format' => $format,
            'bytes' => $item['bytes'],
            'created_at' => $item['created_at'],
            'original_filename' => $original_filename,
            'resource_type' => $item['resource_type']
        ];
    }, $allResources);
    echo json_encode($files);
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
?> 