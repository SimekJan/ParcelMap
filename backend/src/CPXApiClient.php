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
	public function getParcelsInBoundedBox(array $bbox): string {
		if (count($bbox) !== 4 || count(array_filter($bbox, static fn ($coordinate): bool => !is_numeric($coordinate))) > 0) {
			throw new \InvalidArgumentException('Bounding box must contain four numbers.');
		}

		return $this->apiClient->get('', [
			'service' => 'WFS',
			'version' => '2.0.0',
			'request' => 'GetPropertyValue',
			'typeNames' => 'CadastralParcel',
			'valueReference' => './/cp:geometry',
			'BBOX' => implode(',', array_map('strval', array_values($bbox))),
			'srsName' => 'http://www.opengis.net/def/crs/EPSG/0/3857',
		], 'application/gml+xml; version=3.2');
	}

	public function getParcelAtPoint(float $longitude, float $latitude): string {
        if (!is_finite($longitude) || !is_finite($latitude)) {
            throw new \InvalidArgumentException('Coordinates must be finite numbers.');
        }

        $point = '<gml:Point srsName="http://www.opengis.net/def/crs/EPSG/0/3857" xmlns:gml="http://www.opengis.net/gml/3.2"><gml:pos>'
            . $longitude . ' ' . $latitude . '</gml:pos></gml:Point>';

        return $this->apiClient->get('', [
            'service' => 'WFS',
            'version' => '2.0.0',
            'request' => 'GetFeature',
            'storedQuery_id' => 'GetFeatureByPoint',
            'POINT' => $point,
            'FEATURE_TYPE' => 'CadastralParcel',
        ], 'application/gml+xml; version=3.2');
    }
}