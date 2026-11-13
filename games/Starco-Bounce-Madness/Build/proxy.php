<?php
/**
 * proxy.php — Proxy HTTPS → HTTP para Dreamlo Leaderboard
 * Reside en el servidor propio (HTTPS), hace la petición a Dreamlo (HTTP)
 * sin restricciones de Mixed Content del navegador.
 *
 * Uso: proxy.php?url=http%3A%2F%2Fdreamlo.com%2Flb%2F...
 */

// Permitir que Unity WebGL (cualquier origen) llame este script
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: text/plain; charset=utf-8");

// Responder inmediatamente a preflight OPTIONS (CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$url = isset($_GET['url']) ? trim($_GET['url']) : '';

// Validar que la URL exista y sea de Dreamlo (seguridad)
if (empty($url)) {
    http_response_code(400);
    echo 'ERROR: Falta el parámetro ?url=';
    exit;
}

if (!preg_match('#^https?://(www\.)?dreamlo\.com/#i', $url)) {
    http_response_code(403);
    echo 'ERROR: Solo se permiten URLs de dreamlo.com';
    exit;
}

// Hacer la petición HTTP a Dreamlo con cURL
$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'UnityWebGL-Proxy/1.0');
// Dreamlo usa HTTP; no verificar SSL (no aplica pero por si cambia)
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error    = curl_error($ch);
curl_close($ch);

if ($response === false || $error) {
    http_response_code(502);
    echo 'ERROR: No se pudo contactar con Dreamlo: ' . $error;
    exit;
}

http_response_code($httpCode);
echo $response;
