<?php
// verify_pixel.php
$token = 'f9489be2-b554-47e2-8642-68eea09a1868'; // Org 2
$pageViewId = 'manual-test-' . time();
$ts = time();
$sig = hash_hmac('sha256', $token . $pageViewId . $ts, $token);

$payload = [
    'token' => $token,
    'page_view_id' => $pageViewId,
    'page_url' => 'http://manual-test.com',
    '_ts' => $ts,
    '_sig' => $sig,
];

$ch = curl_init('http://127.0.0.1:8000/cdn/ad-hit');
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type:application/json']);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: $httpCode\n";
echo "Response: $response\n";
