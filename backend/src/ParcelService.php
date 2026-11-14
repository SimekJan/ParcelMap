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
        // 1. Parse the bounding box from the input value
        // 2. Validate the bounding box coordinates
        // 3. Call the CUZK API to get parcels within the bounding box
        // 4. Transform the response to the desired format
        // 5. Return the transformed response

        return []; // Placeholder return value
    }

    /**
     * Identifies a parcel based on the provided point's coordinates and transforms the response to the desired format.
     */
    public function identifyParcel( /* TBD */ ): array {
        // 1. Parse the latitude and longitude from the input values
        // 2. Validate the latitude and longitude coordinates
        // 3. Call the CUZK API to identify the parcel at the given coordinates
        // 4. Transform the response to the desired format
        // 5. Return the transformed response

        return []; // Placeholder return value
    }
}