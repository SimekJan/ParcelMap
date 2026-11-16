<?php

namespace Simekja\Backend;

/**
 * FormatTransformer class is responsible for transforming geo-data into different formats.
 */
class FormatTransformer {
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
        $features = $xpath->query('//*[local-name()="CadastralParcel"]');
        $parcels = [];

        foreach ($features as $feature) {
            $parcelNumberNodes = $xpath->query('./*[local-name()="label"]', $feature);
            $areaNodes = $xpath->query('./*[local-name()="areaValue"]', $feature);
            $municipalityNodes = $xpath->query('./*[local-name()="administrativeUnit"]', $feature);
            $zoningNodes = $xpath->query('./*[local-name()="zoning"]', $feature);
            $geometryNodes = $xpath->query(
                './*[local-name()="geometry"]/*[local-name()="Polygon"]',
                $feature
            );

            if (
                $parcelNumberNodes->length === 0 ||
                $areaNodes->length === 0 ||
                $municipalityNodes->length === 0 ||
                $zoningNodes->length === 0 ||
                $geometryNodes->length === 0
            ) {
                continue;
            }

            $municipalityName = $municipalityNodes->item(0)->attributes->getNamedItem('title')?->nodeValue;
            $zoning = $zoningNodes->item(0)->attributes->getNamedItem('title')?->nodeValue;
            $parcelNumber = trim($parcelNumberNodes->item(0)->textContent);
            $area = trim($areaNodes->item(0)->textContent);

            if ($municipalityName === null || $zoning === null || $parcelNumber === '' || $area === '') {
                continue;
            }

            $parcels[] = [
                'parcelNumber' => $parcelNumber,
                'municipalityName' => $municipalityName,
                'area' => $area,
                'zoning' => $zoning,
                'geometry' => $geometryNodes->item(0)->C14N(true),
            ];
        }

        return $parcels;
    }
}