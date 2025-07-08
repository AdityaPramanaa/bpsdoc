<?php
session_start();
header('Content-Type: application/json');

// Koneksi ke database
$conn = new mysqli('localhost', 'root', '', 'bps_dokumen');
if ($conn->connect_error) {
    echo json_encode(['success' => false, 'error' => 'Database connection failed']);
    exit;
}

// Ambil data dari JSON body atau POST
$input = json_decode(file_get_contents('php://input'), true);
if ($input && isset($input['username'])) {
    $username = $input['username'];
    $password = $input['password'];
} else {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
}

$stmt = $conn->prepare("SELECT id, password, role FROM users WHERE username = ?");
$stmt->bind_param("s", $username);
$stmt->execute();
$stmt->bind_result($id, $hashed_password, $role);
if ($stmt->fetch() && password_verify($password, $hashed_password)) {
    $_SESSION['user_id'] = $id;
    $_SESSION['role'] = $role;
    echo json_encode(['success' => true, 'role' => $role, 'user_id' => $id]);
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid credentials']);
}
$stmt->close();
$conn->close(); 