<?php
ob_start();
ini_set('display_errors', 1);
error_reporting(E_ALL);

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');
require 'vendor/autoload.php';
require 'cloudinary_config.php';

use PhpOffice\PhpSpreadsheet\IOFactory;
use Smalot\PdfParser\Parser;

$query = isset($_GET['query']) ? trim($_GET['query']) : '';
if ($query === '') {
    echo json_encode([]);
    exit;
}
$queryLower = mb_strtolower($query);

// Ambil metadata file dari Cloudinary (seperti list_files.php)
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
} catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    exit;
}

$results = [];
foreach ($files as $file) {
    $url = $file['url'];
    $ext = strtolower(pathinfo($file['original_filename'], PATHINFO_EXTENSION));
    $publicIdExt = strtolower(pathinfo($file['public_id'], PATHINFO_EXTENSION));
    $isExcel = in_array($file['format'], ['xls', 'xlsx']) || in_array($ext, ['xls', 'xlsx']) || in_array($publicIdExt, ['xls', 'xlsx']) || preg_match('/xls|xlsx/i', $file['original_filename']);
    $isPDF = $file['format'] === 'pdf' || $ext === 'pdf' || $publicIdExt === 'pdf' || preg_match('/pdf/i', $file['original_filename']);
    $type = $isExcel ? 'excel' : ($isPDF ? 'pdf' : 'other');
    $fileName = $file['original_filename'] . '.' . $file['format'];
    if ($type === 'excel') {
        $tmp = tempnam(sys_get_temp_dir(), 'excel_');
        file_put_contents($tmp, file_get_contents($url));
        try {
            $spreadsheet = IOFactory::load($tmp);
            foreach ($spreadsheet->getWorksheetIterator() as $sheet) {
                $sheetName = $sheet->getTitle();
                $rows = $sheet->toArray(null, true, true, true); // ambil semua cell, termasuk kolom huruf
                foreach ($rows as $rowIdx => $row) {
                    foreach ($row as $colKey => $cell) {
                        if (mb_stripos((string)$cell, $query) !== false) {
                            $results[] = [
                                'file' => $fileName,
                                'type' => 'excel',
                                'sheet' => $sheetName,
                                'row' => $rowIdx,
                                'column' => $colKey,
                                'value' => $cell
                            ];
                        }
                    }
                }
            }
        } catch (Exception $e) {
            // skip file error
        }
        unlink($tmp);
    } else if ($type === 'pdf') {
        $tmp = tempnam(sys_get_temp_dir(), 'pdf_');
        file_put_contents($tmp, file_get_contents($url));
        try {
            $parser = new Parser();
            $pdf = $parser->parseFile($tmp);
            $pages = $pdf->getPages();
            foreach ($pages as $i => $page) {
                $text = $page->getText();
                if (mb_stripos($text, $query) !== false) {
                    $pos = mb_stripos($text, $query);
                    $snippet = mb_substr($text, max(0, $pos - 30), mb_strlen($query) + 60);
                    $results[] = [
                        'file' => $fileName,
                        'type' => 'pdf',
                        'page' => $i + 1,
                        'snippet' => $snippet
                    ];
                }
            }
        } catch (Exception $e) {
            // skip file error
        }
        unlink($tmp);
    }
}
echo json_encode($results);

$output = ob_get_clean();
if (strlen(trim($output)) > 0) {
    file_put_contents('debug_search_output.txt', $output);
} 