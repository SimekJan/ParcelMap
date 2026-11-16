
import { useEffect, useRef } from 'react';
import { getMunicipalities } from "../api/municipalities";
import { getParcels } from "../api/parcels"

import 'ol/ol.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';

import Feature from 'ol/Feature.js';
import GML32 from 'ol/format/GML32.js';
import Geometry from 'ol/geom/Geometry.js';

import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import Fill from 'ol/style/Fill.js';

const MIN_PARCEL_ZOOM = 16;
const INITIAL_MAP_EXTENT: [number, number, number, number] = [
  1681657.0769263285,
  6493348.868468613,
  1739097.271937819,
  6542426.523715009,
];

/**
 * Returns the visible map extent in the view projection (EPSG:3857).
 */
function getVisibleBbox(map: Map): number[] | null {
  const size = map.getSize();
  if (!size) return null;

  return map.getView().calculateExtent(size);
}

function parseParcelFeatures(xml: string): Feature<Geometry>[] {
  const xmlDocument = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error(`XML parsing failed: ${parserError.textContent}`);
  }

  const polygons = Array.from(
    xmlDocument.getElementsByTagNameNS(
      'http://www.opengis.net/gml/3.2',
      'Polygon'
    )
  );

  if (polygons.length === 0) {
    throw new Error('No GML Polygons found in the XML.');
  }

  const format = new GML32();
  return polygons.map((polygon) => {
    const geometryProperty = polygon.parentElement;

    if (!geometryProperty) {
      throw new Error('A GML Polygon has no geometry property.');
    }

    const geometry = format.readGeometry(geometryProperty, {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857',
    });

    if (!geometry) {
      throw new Error('Could not parse a parcel geometry.');
    }

    return new Feature<Geometry>({ geometry });
  });
}

function parseMunicipalityFeatures(xml: string): Feature<Geometry>[] {
  const xmlDocument = new DOMParser().parseFromString(xml, 'application/xml');
  const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error(`XML parsing failed: ${parserError.textContent}`);
  }

  const geometries = Array.from(
    xmlDocument.getElementsByTagNameNS(
      'http://inspire.ec.europa.eu/schemas/au/4.0',
      'geometry'
    )
  );

  if (geometries.length === 0) {
    throw new Error('No municipality geometries found in the XML.');
  }

  const format = new GML32();
  return geometries.map((geometryElement) => {
    const geometry = format.readGeometry(geometryElement, {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857',
    });

    if (!geometry) {
      throw new Error('Could not parse a municipality geometry.');
    }

    return new Feature<Geometry>({ geometry });
  });
}

/**
 * Renders the parcel map and queries visible bounds after map movement.
 * Map coordinates and bbox values use EPSG:3857; parcel geometry is hidden
 * below the minimum parcel zoom level.
 */
export default function ParcelMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapElement.current) return;

    let map: Map | undefined;
    let disposed = false;
    let parcelRequestId = 0;

    function initializeMap(): void {
      try {
        const parcelSource = new VectorSource();

        const parcelLayer = new VectorLayer({
          source: parcelSource,
          visible: false,
          style: new Style({
            stroke: new Stroke({
              color: '#e53935',
              width: 3,
            }),
            fill: new Fill({
              color: 'rgba(229, 57, 53, 0.15)',
            }),
          }),
        });

        const municipalitySource = new VectorSource();
        const municipalitiesLayer = new VectorLayer({
          source: municipalitySource,
          visible: true,
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(35, 91, 82, 0.8)',
              width: 1.5,
            }),
            fill: new Fill({
              color: 'rgba(80, 156, 142, 0.08)',
            }),
          }),
        });

        map = new Map({
          target: mapElement.current!,
          layers: [
            new TileLayer({
              source: new OSM(),
            }),
            municipalitiesLayer,
            parcelLayer,
          ],
          view: new View({
            projection: 'EPSG:3857',
            extent: INITIAL_MAP_EXTENT,
            center: [0, 0],
            zoom: 2,
          }),
        });

        const view = map.getView();
        const updateMinimumZoom = (): void => {
          const size = map?.getSize();
          if (!size || size[0] <= 0 || size[1] <= 0) return;

          const fitResolution = view.getResolutionForExtent(
            INITIAL_MAP_EXTENT,
            size
          );
          const minimumZoom = view.getZoomForResolution(fitResolution);
          if (minimumZoom !== undefined) view.setMinZoom(minimumZoom);
        };

        // Recalculate the zoom-out limit when the map viewport is resized.
        map.on('change:size', updateMinimumZoom);
        updateMinimumZoom();

        // Recheck parcel visibility and query the current extent after each move.
        map.on('moveend', () => {
          const currentRequestId = ++parcelRequestId;
          const zoom = map!.getView().getZoom() ?? 0;
          const showParcels = zoom >= MIN_PARCEL_ZOOM;
          parcelLayer.setVisible(showParcels);
          municipalitiesLayer.setVisible(!showParcels);

          console.log('Map moved. Current zoom level:', zoom);

          if (!showParcels) {
            parcelSource.clear(true);
            return;
          }

          const bbox = getVisibleBbox(map!);
          if (!bbox) return;
          parcelSource.clear(true);
          console.log('Fetching parcels for bbox:', bbox);

          void getParcels(bbox)
            .then((xml) => {
              if (
                disposed ||
                currentRequestId !== parcelRequestId ||
                (view.getZoom() ?? 0) < MIN_PARCEL_ZOOM
              ) {
                return;
              }

              parcelSource.addFeatures(parseParcelFeatures(xml));
            })
            .catch((error: unknown) => {
              console.error(
                'Failed to fetch parcels for the visible map extent:',
                error instanceof Error ? error.message : error
              );
            });
        });

        void getMunicipalities()
          .then((xml) => {
            if (!disposed) {
              municipalitySource.addFeatures(parseMunicipalityFeatures(xml));
            }
          })
          .catch((error: unknown) => {
            console.error(
              'Failed to fetch municipality boundaries:',
              error instanceof Error ? error.message : error
            );
          });

        // Keep the requested area visible, fitting the full extent to the screen.
        view.fit(INITIAL_MAP_EXTENT, {
          padding: [0, 0, 0, 0],
          maxZoom: 19,
        });
      } catch (error: unknown) {
        console.error(
          'Map initialization failed:',
          error instanceof Error ? error.message : error
        );
      }
    }

    void initializeMap();

    return () => {
      disposed = true;
      map?.setTarget(undefined);
    };
  }, []);

  return (
    <div
      ref={mapElement}
      style={{
        width: '100%',
        height: '100%',
      }}
    />
  );
}
