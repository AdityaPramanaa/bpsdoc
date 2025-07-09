<?php
session_start();
header('Content-Type: application/json');

// Ambil data dari JSON body atau POST
$input = json_decode(file_get_contents('php://input'), true);
if ($input && isset($input['username'])) {
    $username = $input['username'];
    $password = $input['password'];
} else {
    $username = $_POST['username'] ?? '';
    $password = $_POST['password'] ?? '';
}

// Login statis
if ($username === 'bpsprov' && $password === '@bps2025') {
    $_SESSION['user_id'] = 1;
    $_SESSION['role'] = 'admin';
    echo json_encode(['success' => true, 'role' => 'admin', 'user_id' => 1]);
} else {
    echo json_encode(['success' => false, 'error' => 'Username atau password salah']);
} 