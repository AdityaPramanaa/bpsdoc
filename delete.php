<?php
require_once __DIR__ . '/vendor/autoload.php';
require 'cloudinary_config.php';

header('Content-Type: application/json');

$cloudinary = new \Cloudinary\Cloudinary([
    'cloud' => [
        'cloud_name' => 'dqwnckoeu',
        'api_key'    => '345733924435416',
        'api_secret' => 'p_QqW6bmYSxSADSfK7O-OCctL4k',
    ],
    'url' => [
        'secure' => true
    ]
]);

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['public_id'])) {
    $public_id = $_POST['public_id'];
    try {
        // Hapus file dari Cloudinary (resource_type raw untuk PDF/Excel)
        $cloudinary->uploadApi()->destroy($public_id, ["resource_type" => "raw"]);

        // Hapus metadata dari database
        $conn = new mysqli("localhost", "root", "", "bps_dokumen");
        $stmt = $conn->prepare("DELETE FROM documents WHERE public_id = ?");
        $stmt->bind_param("s", $public_id);
        $stmt->execute();
        $stmt->close();
        $conn->close();

        echo json_encode(["success" => true]);
    } catch (Exception $e) {
        echo json_encode(["success" => false, "error" => $e->getMessage()]);
    }
} else {
    echo json_encode(["success" => false, "error" => "No public_id provided"]);
}
?> 