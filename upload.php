<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
require_once __DIR__ . '/vendor/autoload.php';
require 'cloudinary_config.php';

// Blok debug dinonaktifkan agar proses upload berjalan normal

// Inisialisasi Cloudinary object (v3.x)
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

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['file'])) {
    $file = $_FILES['file']['tmp_name'];
    $fileName = $_FILES['file']['name'];

    try {
        $ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
        $baseName = pathinfo($fileName, PATHINFO_FILENAME);

        // Jika file berakhiran .pdf.tmp, ubah ke .pdf dan deteksi sebagai PDF
        if ($ext === 'tmp' && preg_match('/\.pdf$/i', $baseName)) {
            $ext = 'pdf';
            $baseName = preg_replace('/\.pdf$/i', '', $baseName);
            $fileName = preg_replace('/\.pdf\.tmp$/i', '.pdf', $fileName);
            // Rename file fisik sebelum upload ke Cloudinary
            $newTmpFile = tempnam(sys_get_temp_dir(), 'pdfupload_') . '.pdf';
            copy($file, $newTmpFile);
            $file = $newTmpFile;
        }
        // Pastikan publicId dan nama file tidak mengandung .tmp
        if ($ext === 'pdf' && preg_match('/\.tmp$/i', $fileName)) {
            $fileName = preg_replace('/\.tmp$/i', '', $fileName);
            $baseName = preg_replace('/\.tmp$/i', '', $baseName);
        }
        $isExcel = in_array($ext, ['xls', 'xlsx']);
        $isPDF = $ext === 'pdf' || preg_match('/\.pdf(\.tmp)?$/i', $fileName);
        $type = $isExcel ? 'excel' : ($isPDF ? 'pdf' : 'other');
        $publicId = $baseName . '-' . time() . '.' . $ext;
        $uploadOptions = [
            'resource_type' => ($isExcel || $isPDF) ? 'raw' : 'auto',
            'public_id' => $publicId
        ];
        $result = $cloudinary->uploadApi()->upload($file, $uploadOptions);

        // Setelah upload ke Cloudinary dan dapat $result
        $name = $result['original_filename'];
        $url = $result['secure_url'];
        $size = $result['bytes'];
        $public_id = $result['public_id'];
        $upload_date = date('Y-m-d H:i:s');
        $created_by = $_SESSION['user_id'] ?? null;

        // Simpan metadata ke MySQL
        eval('$conn = new mysqli("localhost", "root", "", "bps_dokumen");');
        $stmt = $conn->prepare("INSERT INTO documents (name, url, type, size, upload_date, public_id, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("sssissi", $name, $url, $type, $size, $upload_date, $public_id, $created_by);
        $stmt->execute();
        $doc_id = $stmt->insert_id;
        $stmt->close();
        $conn->close();

        // Return response ke frontend
        echo json_encode([
            'success' => true,
            'id' => $doc_id,
            'name' => $name,
            'url' => $url,
            'type' => $type,
            'size' => $size,
            'upload_date' => $upload_date,
            'public_id' => $public_id
        ]);
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'No file uploaded']);
}
?> 