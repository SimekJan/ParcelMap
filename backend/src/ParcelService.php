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

    /**
     * Retrieves parcels within a specified bounding box and transforms the response to the desired format.
     */
    public function getParcels(/* TBD */): array {
        // 1. Parse and validate the bounding box
        // 2. Retrieve matching parcels from CUZK
        // 3. Transform each result to the API schema
        return []; // Placeholder return value
    }
}