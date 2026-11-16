
import { useEffect, useRef } from 'react';
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
import { pointerMove, singleClick } from 'ol/events/condition.js';

import Feature from 'ol/Feature.js';
import GML32 from 'ol/format/GML32.js';
import Geometry from 'ol/geom/Geometry.js';

import Style from 'ol/style/Style.js';
import Stroke from 'ol/style/Stroke.js';
import Fill from 'ol/style/Fill.js';

const MIN_PARCEL_ZOOM = 16;
type Municipality = components['schemas']['Municipality']
type Parcel = components['schemas']['Parcel']
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

function parseParcelFeatures(parcels: Parcel[]): Feature<Geometry>[] {
  const format = new GML32();
  const xmlDocument = new DOMParser().parseFromString(
    `<geometryCollection>${parcels.map((parcel) => `<geometry>${parcel.geometry}</geometry>`).join('')}</geometryCollection>`,
    'application/xml'
  );
  const parserError = xmlDocument.getElementsByTagName('parsererror')[0];

  if (parserError) {
    throw new Error(`XML parsing failed: ${parserError.textContent}`);
  }

  const geometryNodes = xmlDocument.getElementsByTagName('geometry');

  if (geometryNodes.length !== parcels.length) {
    throw new Error('Parcel geometry count does not match parcel count.');
  }

  return parcels.map((parcel, index) => {
    const geometryNode = geometryNodes.item(index);
    if (!geometryNode) {
      throw new Error(`Could not find geometry for parcel ${parcel.parcelNumber}.`);
    }

    const geometry = format.readGeometry(geometryNode, {
      dataProjection: 'EPSG:3857',
      featureProjection: 'EPSG:3857',
    });

    if (!geometry) {
      throw new Error(`Could not parse geometry for parcel ${parcel.parcelNumber}.`);
    }

    return new Feature<Geometry>({
      geometry,
      name: parcel.parcelNumber,
      municipalityName: parcel.municipalityName,
      area: parcel.area,
      zoning: parcel.zoning,
    });
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
export default function ParcelMap() {
  const mapElement = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!mapElement.current) return;
    const mapContainer = mapElement.current!;

    let map: Map | undefined;
    let disposed = false;
    let parcelRequestId = 0;
    let clearHoveredFeature: (() => void) | undefined;

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

        const handlePointerLeave = (): void => {
          parcelHoverInteraction.getFeatures().clear();
          municipalityHoverInteraction.getFeatures().clear();
        };
        clearHoveredFeature = handlePointerLeave;
        mapContainer.addEventListener('pointerleave', handlePointerLeave);

        const parcelClickInteraction = new Select({
          condition: singleClick,
          layers: [parcelLayer],
          style: null,
        });
        const municipalityClickInteraction = new Select({
          condition: singleClick,
          layers: [municipalitiesLayer],
          style: null,
        });
        parcelClickInteraction.on('select', (event) => {
          const parcel = event.selected[0];
          if (parcel) console.log('Parcel clicked:', parcel.get('name'));
        });
        municipalityClickInteraction.on('select', (event) => {
          const municipality = event.selected[0];
          if (municipality) {
            console.log('Municipality clicked:', municipality.get('name'));
          }
        });
        map.addInteraction(parcelClickInteraction);
        map.addInteraction(municipalityClickInteraction);

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
            .then((parcels) => {
              if (
                disposed ||
                currentRequestId !== parcelRequestId ||
                (view.getZoom() ?? 0) < MIN_PARCEL_ZOOM
              ) {
                return;
              }

              parcelSource.addFeatures(parseParcelFeatures(parcels));
            })
            .catch((error: unknown) => {
              console.error(
                'Failed to fetch parcels for the visible map extent:',
                error instanceof Error ? error.message : error
              );
            });
        });

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
      if (clearHoveredFeature) {
        mapContainer.removeEventListener('pointerleave', clearHoveredFeature);
      }
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
