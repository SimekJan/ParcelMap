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
            if (!($feature instanceof \DOMElement)) {
                continue;
            }

            $parcelNumber = '';
            $area = '';
            $municipalityName = null;
            $zoning = null;
            $geometry = null;

            foreach ($feature->childNodes as $property) {
                if (!($property instanceof \DOMElement)) {
                    continue;
                }

                switch ($property->localName) {
                    case 'label':
                        $parcelNumber = trim($property->textContent);
                        break;
                    case 'areaValue':
                        $area = trim($property->textContent);
                        break;
                    case 'administrativeUnit':
                        $municipalityName = $property->getAttributeNS(
                            'http://www.w3.org/1999/xlink',
                            'title'
                        ) ?: null;
                        break;
                    case 'zoning':
                        $zoning = $property->getAttributeNS(
                            'http://www.w3.org/1999/xlink',
                            'title'
                        ) ?: null;
                        break;
                    case 'geometry':
                        foreach ($property->childNodes as $geometryCandidate) {
                            if (
                                $geometryCandidate instanceof \DOMElement &&
                                $geometryCandidate->localName === 'Polygon'
                            ) {
                                $geometry = $geometryCandidate;
                                break;
                            }
                        }
                        break;
                }
            }

            if (
                $municipalityName === null ||
                $zoning === null ||
                $parcelNumber === '' ||
                $area === '' ||
                $geometry === null
            ) {
                continue;
            }

            if ($geometry->namespaceURI !== null) {
                $namespaceAttribute = $geometry->prefix
                    ? 'xmlns:' . $geometry->prefix
                    : 'xmlns';
                $geometry->setAttributeNS(
                    'http://www.w3.org/2000/xmlns/',
                    $namespaceAttribute,
                    $geometry->namespaceURI
                );
            }
            $geometryXml = $document->saveXML($geometry);

            if ($geometryXml === false) {
                throw new \RuntimeException('Unable to serialize parcel geometry.');
            }

            $parcels[] = [
                'parcelNumber' => $parcelNumber,
                'municipalityName' => $municipalityName,
                'area' => $area,
                'zoning' => $zoning,
                'geometry' => $geometryXml,
            ];
        }

        return $parcels;
    }
}