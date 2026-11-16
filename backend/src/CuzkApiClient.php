<?php

namespace Simekja\Backend;

use Simekja\Backend\ApiClient;

/**
 * CuzkApiClient class provides methods to interact with the CUZK API.
 */
class CuzkApiClient {

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