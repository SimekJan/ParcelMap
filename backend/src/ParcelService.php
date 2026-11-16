<?php

namespace Simekja\Backend;

/**
 * ParcelService class provides methods to resolve requests' business logic.
 */
class ParcelService {

    public function __construct(
        private CuzkApiClient $cuzkApiClient,
        private FormatTransformer $formatTransformer
    ) {}

    public function getMunicipalities(): array {
        return $this->loadMockData('municipalities.json');
    }

    public function getParcels(): array {
        return $this->loadMockData('parcels.json');
    }

    private function loadMockData(string $filename): array {
        $path = __DIR__ . '/../data/' . $filename;
        $contents = file_get_contents($path);

        if ($contents === false) {
            throw new \RuntimeException('Unable to read mock data.');
        }

        try {
            $data = json_decode($contents, true, 512, JSON_THROW_ON_ERROR);
        } catch (\JsonException $exception) {
            throw new \RuntimeException('Unable to decode mock data.', 0, $exception);
        }

        if (!is_array($data)) {
            throw new \RuntimeException('Mock data must be an array.');
        }

        return $data;
    }
}