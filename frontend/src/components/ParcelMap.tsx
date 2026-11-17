
import { useEffect, useRef, useState } from 'react';
import { getMunicipalities } from "../api/municipalities";
import { getParcels } from "../api/parcels"
import type { components } from '../api/schema'

import 'ol/ol.css';

import Map from 'ol/Map.js';
import View from 'ol/View.js';
import TileLayer from 'ol/layer/Tile.js';
import VectorLayer from 'ol/layer/Vector.js';
import OSM from 'ol/source/OSM.js';
import VectorSource from 'ol/source/Vector.js';
import Select from 'ol/interaction/Select.js';
import { click, pointerMove } from 'ol/events/condition.js';

import Feature from 'ol/Feature.js';
import GML32 from 'ol/format/GML32.js';
import Geometry from 'ol/geom/Geometry.js';
import { get as getProjection } from 'ol/proj.js';

import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import Fill from 'ol/style/Fill.js';

const MIN_PARCEL_ZOOM = 16;
const MAX_CACHED_PARCELS = 10000;
type Municipality = components['schemas']['Municipality']
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

function parseParcelFeatures(geometries: string[]): Feature<Geometry>[] {
  const format = new GML32();
  const xmlDocument = new DOMParser().parseFromString(
    `<geometryCollection>${geometries.map((geometry) => `<geometry>${geometry}</geometry>`).join('')}</geometryCollection>`,
    'application/xml'
  );
  const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error(`XML parsing failed: ${parserError.textContent}`);
  }

  const geometryNodes = xmlDocument.getElementsByTagName('geometry');

  if (geometryNodes.length !== geometries.length) {
    throw new Error('Parcel geometry count does not match response count.');
  }

  return geometries.map((_, index) => {
    const geometryNode = geometryNodes.item(index);
    if (!geometryNode) {
      throw new Error(`Could not find parcel geometry ${index + 1}.`);
    }

    const geometry = format.readGeometry(geometryNode, {
      dataProjection: getProjection('EPSG:3857')!,
      featureProjection: getProjection('EPSG:3857')!,
    });

    if (!geometry) {
      throw new Error(`Could not parse parcel geometry ${index + 1}.`);
    }

    const id = geometryNode.firstElementChild?.getAttributeNS(
      'http://www.opengis.net/gml/3.2',
      'id'
    );
    const feature = new Feature<Geometry>({
      geometry,
      name: id ?? `Parcel ${index + 1}`,
    });
    feature.setId(id ? `id:${id}` : `geometry:${geometries[index]}`);
    return feature;
  });
}

function parseMunicipalityFeatures(municipalities: Municipality[]): Feature<Geometry>[] {
  const format = new GML32();
  return municipalities.map((municipality) => {
    const xmlDocument = new DOMParser().parseFromString(
      `<geometry>${municipality.geometry}</geometry>`,
      'application/xml'
    );
    const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

    if (parserError) {
      throw new Error(`XML parsing failed: ${parserError.textContent}`);
    }

    const geometry = format.readGeometry(xmlDocument.documentElement, {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857',
    });

    if (!geometry) {
      throw new Error(`Could not parse geometry for municipality ${municipality.municipalityName}.`);
    }

    return new Feature<Geometry>({
      geometry,
      name: municipality.municipalityName,
    });
  });
}

/**
 * Renders the parcel map and queries visible bounds after map movement.
 * Map coordinates and bbox values use EPSG:3857; parcel geometry is hidden
 * below the minimum parcel zoom level.
 */
type ParcelMapProps = {
  onParcelClick: (longitude: number, latitude: number) => void;
};

export default function ParcelMap({ onParcelClick }: ParcelMapProps) {
  const mapElement = useRef<HTMLDivElement | null>(null);
  const onParcelClickRef = useRef(onParcelClick);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    onParcelClickRef.current = onParcelClick;
  }, [onParcelClick]);

  useEffect(() => {
    if (!mapElement.current) return;
    const mapContainer = mapElement.current!;

    let map: Map | undefined;
    let disposed = false;
    let pendingRequests = 0;
    let clearHoveredFeature: (() => void) | undefined;
    let resizeObserver: ResizeObserver | undefined;

    const beginLoading = (): void => {
      pendingRequests += 1;
      setIsLoading(true);
    };

    const endLoading = (): void => {
      pendingRequests -= 1;
      if (!disposed && pendingRequests === 0) setIsLoading(false);
    };

    function initializeMap(): void {
      try {
        const parcelSource = new VectorSource();
        let cachedParcels: Feature<Geometry>[] = [];

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
          target: mapContainer,
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

        const parcelHoverInteraction = new Select({
          condition: pointerMove,
          layers: [parcelLayer],
          style: new Style({
            stroke: new Stroke({
              color: '#e53935',
              width: 4,
            }),
            fill: new Fill({
              color: 'rgba(229, 57, 53, 0.4)',
            }),
          }),
        });

        const parcelSelectionInteraction = new Select({
          condition: click,
          layers: [parcelLayer],
          style: new Style({
            stroke: new Stroke({
              color: '#e53935',
              width: 4,
            }),
            fill: new Fill({
              color: 'rgba(0, 167, 160, 0.35)',
            }),
          }),
        });

        const municipalityHoverInteraction = new Select({
          condition: pointerMove,
          layers: [municipalitiesLayer],
          style: new Style({
            stroke: new Stroke({
              color: 'rgba(35, 91, 82, 0.95)',
              width: 3,
            }),
            fill: new Fill({
              color: 'rgba(80, 156, 142, 0.3)',
            }),
          }),
        });

        map.addInteraction(parcelHoverInteraction);
        map.addInteraction(municipalityHoverInteraction);
        map.addInteraction(parcelSelectionInteraction);

        const handlePointerLeave = (): void => {
          parcelHoverInteraction.getFeatures().clear();
          municipalityHoverInteraction.getFeatures().clear();
        };
        clearHoveredFeature = handlePointerLeave;
        mapContainer.addEventListener('pointerleave', handlePointerLeave);

        map.on('singleclick', (event) => {
          if (parcelLayer.getVisible()) {
            onParcelClickRef.current(event.coordinate[0], event.coordinate[1]);
            return;
          }

          const municipality = map!.forEachFeatureAtPixel(event.pixel, (feature) => feature, {
            layerFilter: (layer) => layer === municipalitiesLayer,
          });
          const geometry = municipality?.getGeometry();
          if (geometry) {
            map!.getView().fit(geometry.getExtent(), { padding: [32, 32, 32, 32], duration: 500, maxZoom: 19 });
          }
        });

        resizeObserver = new ResizeObserver(() => map?.updateSize());
        resizeObserver.observe(mapContainer);

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
          const zoom = map!.getView().getZoom() ?? 0;
          const showParcels = zoom >= MIN_PARCEL_ZOOM;
          parcelLayer.setVisible(showParcels);
          municipalitiesLayer.setVisible(!showParcels);

          console.log('Map moved. Current zoom level:', zoom);

          if (!showParcels) {
            return;
          }

          const bbox = getVisibleBbox(map!);
          if (!bbox) return;
          console.log('Fetching parcels for bbox:', bbox);

          beginLoading();
          void getParcels(bbox)
            .then((parcels) => {
              if (disposed) return;

              const seenIds = new Set<string | number>();
              const features = parseParcelFeatures(parcels).filter((feature) => {
                const id = feature.getId()!;
                if (seenIds.has(id) || parcelSource.getFeatureById(id)) return false;
                seenIds.add(id);
                return true;
              });
              if (features.length === 0) return;

              const candidates = [...cachedParcels, ...features];
              const excess = candidates.length - MAX_CACHED_PARCELS;
              if (excess <= 0) {
                cachedParcels = candidates;
                parcelSource.addFeatures(features);
                return;
              }

              const visibleExtent = getVisibleBbox(map!);
              const outsideViewport = visibleExtent
                ? candidates.filter((feature) => !feature.getGeometry()?.intersectsExtent(visibleExtent))
                : candidates;
              const evicted = new Set(outsideViewport.slice(0, excess));
              if (evicted.size < excess) {
                for (const feature of candidates) {
                  if (evicted.size >= excess) break;
                  evicted.add(feature);
                }
              }

              const removed = cachedParcels.filter((feature) => evicted.has(feature));
              if (removed.length > 0) parcelSource.removeFeatures(removed);
              cachedParcels = candidates.filter((feature) => !evicted.has(feature));
              const added = features.filter((feature) => !evicted.has(feature));
              if (added.length > 0) parcelSource.addFeatures(added);
            })
            .catch((error: unknown) => {
              console.error(
                'Failed to fetch parcels for the visible map extent:',
                error instanceof Error ? error.message : error
              );
            })
            .finally(endLoading);
        });

        beginLoading();
        void getMunicipalities()
          .then((municipalities) => {
            if (!disposed) {
              municipalitySource.addFeatures(parseMunicipalityFeatures(municipalities));
            }
          })
          .catch((error: unknown) => {
            console.error(
              'Failed to fetch municipality boundaries:',
              error instanceof Error ? error.message : error
            );
          })
          .finally(endLoading);

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
      if (clearHoveredFeature) {
        mapContainer.removeEventListener('pointerleave', clearHoveredFeature);
      }
      resizeObserver?.disconnect();
      map?.setTarget(undefined);
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={mapElement} className="h-full w-full" />
      {isLoading && (
        <div
          role="status"
          className="pointer-events-none absolute right-3 top-3 flex items-center gap-2 rounded bg-white px-3 py-2 text-sm text-gray-800 shadow-md"
        >
          <span
            aria-hidden="true"
            className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-teal-700 motion-reduce:animate-none"
          />
          Loading map data
        </div>
      )}
    </div>
  );
}
