<?php

namespace Simekja\Backend;

/**
 * FormatTransformer class is responsible for transforming geo-data into different formats.
 */
class FormatTransformer {
    public function transformParcelDetails(string $data): array {
        $document = new \DOMDocument();
        $previousErrorSetting = libxml_use_internal_errors(true);

        try {
            $isValidXml = $document->loadXML($data, LIBXML_NONET);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorSetting);
        }

        if (!$isValidXml || !$document->documentElement) {
            throw new \RuntimeException('Parcel details response must be valid XML.');
        }

        $xpath = new \DOMXPath($document);
        $root = $document->documentElement;
        if (!in_array($root->localName, ['CadastralParcel', 'FeatureCollection'], true)) {
            throw new \RuntimeException('Unexpected parcel details response.');
        }

        $parcels = [];
        $allowedProperties = ['label', 'administrativeUnit', 'zoning', 'areaValue', 'landType'];
        foreach ($xpath->query('//*[local-name()="CadastralParcel"]') as $feature) {
            if (!$feature instanceof \DOMElement) continue;
            $properties = [];
            foreach ($feature->childNodes as $property) {
                if (!$property instanceof \DOMElement || !in_array($property->localName, $allowedProperties, true)) {
                    continue;
                }

                $value = trim($property->getAttributeNS('http://www.w3.org/1999/xlink', 'title'));
                if ($value === '') {
                    $value = trim($property->textContent);
                }
                if ($value === '' && $property->localName === 'landType') {
                    $path = parse_url($property->getAttributeNS('http://www.w3.org/1999/xlink', 'href'), PHP_URL_PATH);
                    if (is_string($path) && str_contains($path, '/LandTypeValue/')) {
                        $value = rawurldecode(basename($path));
                    }
                }
                if ($value !== '') {
                    $properties[] = ['name' => $property->localName, 'value' => $value];
                }
            }

            $parcels[] = [
                'id' => $feature->getAttributeNS('http://www.opengis.net/gml/3.2', 'id'),
                'properties' => $properties,
            ];
        }

        return $parcels;
    }

    public function transformMunicipalityData(string $data): array {

        $document = new \DOMDocument();
        $previousErrorSetting = libxml_use_internal_errors(true);

        try {
            $isValidXml = $document->loadXML($data, LIBXML_NONET);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorSetting);
        }

        if (!$isValidXml) {
            throw new \InvalidArgumentException('Municipality data must be valid XML.');
        }

        $xpath = new \DOMXPath($document);
        $features = $xpath->query('//*[local-name()="AdministrativeUnit"]');
        $municipalities = [];

        foreach ($features as $feature) {
            $nameProperties = $xpath->query('./*[local-name()="name"]', $feature);
            $municipalityName = null;

            foreach ($nameProperties as $nameProperty) {
                $nameNodes = $xpath->query('.//*[local-name()="text"]', $nameProperty);
                if ($nameNodes->length === 0) {
                    $nameNodes = $xpath->query('.//*[local-name()="SpellingOfName"]', $nameProperty);
                }

                foreach ($nameNodes as $nameNode) {
                    $value = trim($nameNode->textContent);
                    if ($value !== '') {
                        $municipalityName = $value;
                        break 2;
                    }
                }

                $value = trim($nameProperty->textContent);
                if ($value !== '') {
                    $municipalityName = $value;
                    break;
                }
            }

            $geometryNodes = $xpath->query(
                './*[local-name()="geometry"]//*[local-name()="MultiSurface"] | ./*[local-name()="geometry"][local-name()="MultiSurface"]',
                $feature
            );

            if ($municipalityName === null || $geometryNodes->length === 0) {
                continue;
            }

            $municipalities[] = [
                'municipalityName' => $municipalityName,
                'geometry' => $geometryNodes->item(0)->C14N(true),
            ];
        }

        return $municipalities;
    }

    public function transformParcelData(string $data): array {
        $document = new \DOMDocument();
        $previousErrorSetting = libxml_use_internal_errors(true);

        try {
            $isValidXml = $document->loadXML($data, LIBXML_NONET);
        } finally {
            libxml_clear_errors();
            libxml_use_internal_errors($previousErrorSetting);
        }

        if (!$isValidXml) {
            throw new \InvalidArgumentException('Parcel data must be valid XML.');
        }

        $xpath = new \DOMXPath($document);
        $members = $xpath->query('//*[local-name()="member"]');
        $geometries = [];

        foreach ($members as $member) {
            $geometry = trim($member->textContent);
            if ($geometry !== '') {
                $geometries[] = $geometry;
            }
        }

        return $geometries;
    }
}