<?php

namespace Simekja\Backend;

use Simekja\Backend\ApiClient;

/**
 * CuzkApiClient class provides methods to interact with the CUZK API.
 */
class CuzkApiClient {

	public function __construct(string $baseUrl) {}

    /**
     * Retrieves parcels within a specified bounding box.
     */
	public function getParcelsInBoundedBox(/* TBD */): string {
		return ''; // Placeholder return value
	}

    /**
     * Identifies a parcel based on the provided point's coordinates.
     */
	public function identifyParcel(/* TBD */): string {
		return ''; // Placeholder return value
	}
}