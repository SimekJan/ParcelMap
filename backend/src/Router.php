<?php

namespace Simekja\Backend;

/**
 * Router class handles routing of HTTP requests to the appropriate service methods based on the request method and path.
*/
class Router {

    public function __construct(private ParcelService $parcelService) {}

    /**
     * Dispatches the incoming HTTP request to the appropriate service method based on the request method and path.
     */
    public function dispatch(): void {

        $method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
        $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);

        try {
            if ($method !== 'GET') {
                $this->respond(['error' => 'Method not allowed'], 405);
                return;
            }

            $query = $_GET;
            if ($path === '/parcels') {
                $this->respond(
                    $this->parcelService->getParcels(), 
                    200, 
                    'application/geo+json'
                );
                return;
            }

            if ($path === '/parcels/identify') {
                $this->respond(
                    $this->parcelService->identifyParcel(),
                    200,
                    'application/json'
                );
                return;
            }

            $this->respond(['error' => 'Not found'], 404);

        } catch (\RuntimeException $exception) {
            $this->respond(['error' => $exception->getMessage()], 500);
        }
    }

    /**
     * Sends an HTTP response with the given body, status code, and content type.
     */
    private function respond(array $body, int $status = 200, string $contentType = 'application/json'): void{
        http_response_code($status);
        header('Content-Type: ' . $contentType);
        echo json_encode($body, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
    }
}