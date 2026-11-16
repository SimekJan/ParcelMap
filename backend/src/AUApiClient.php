<?php

namespace Simekja\Backend;

use Simekja\Backend\ApiClient;

/**
 * AUApiClient class provides methods to interact with the CUZK administrative units API.
 */
class AUApiClient {

	private ApiClient $apiClient;
    private string $unitName;

	public function __construct(string $baseUrl, string $unitName) {
		$this->apiClient = new ApiClient($baseUrl);
		$this->unitName = $unitName;
	}

	/**
	 * Retrieves a list of municipalities.
	 */
	public function getMunicipalities(): string {
		return $this->apiClient->get('', [
			'service' => 'WFS',
			'version' => '2.0.0',
			'request' => 'GetFeature',
			'storedQuery_id' => 'GetLowerUnitsByName',
			'UPPER_UNIT_NAME' => $this->unitName,
			'NAT_LEVEL' => '4thOrder',
			'srsName' => 'http://www.opengis.net/def/crs/EPSG/0/3857',
		], 'application/gml+xml; version=3.2');
	}

}