<?php

namespace Simekja\Backend;

use Simekja\Backend\ApiClient;

/**
 * CPXApiClient class provides methods to interact with the CPX Catastral Parcel API.
 */
class CPXApiClient {

	private ApiClient $apiClient;

	public function __construct(string $baseUrl) {
		$this->apiClient = new ApiClient($baseUrl);
	}

    /**
     * Retrieves parcels within a specified bounding box.
     */
	public function getParcelsInBoundedBox(/* TBD */): string {
		return ''; // Placeholder return value		
	}
}