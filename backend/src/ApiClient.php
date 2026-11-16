<?php

namespace Simekja\Backend;

/**
 * ApiClient class provides methods to perform generic HTTP requests to external APIs.
 */
class ApiClient {
    private string $baseUrl;

    public function __construct(string $baseUrl) {
        $this->baseUrl = trim($baseUrl, '/');
    }

    /**
     * Performs a GET request to the specified endpoint with optional query 
     * parameters and returns the response as a string.
     */
    public function get(
        string $endpoint,
        array $params = [],
        string $accept = 'application/json'
    ): string {
        $url = $this->baseUrl;
        if ($endpoint !== '') {
            $url .= '/' . trim($endpoint, '/');
        }

        if (!empty($params)) {
            $url .= '?' . http_build_query($params);
        }

        $headers = [ 'Accept: ' . $accept ];

        $ch = curl_init($url);
        if ($ch === false) {
            throw new \RuntimeException('Failed to initialize cURL');
        }

        $optionsSet = curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPGET => true,
            CURLOPT_HTTPHEADER => $headers,
            CURLOPT_TIMEOUT => 30
        ]);
        if (!$optionsSet) {
            throw new \RuntimeException(curl_error($ch));
        }

        $response = curl_exec($ch);

        if ($response === false) {
            $error = curl_error($ch);
            throw new \RuntimeException($error);
        }

        $status = curl_getinfo($ch, CURLINFO_RESPONSE_CODE);
        if ($status < 200 || $status >= 300) {
            throw new \RuntimeException("HTTP request failed with status {$status}");
        }

        return $response;
    }
}
