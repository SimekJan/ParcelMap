import { apiClient } from './client'
import type { components } from './schema'

type Parcel = components['schemas']['Parcel']

/**
 * Retrieves parcels within a specified bounding box.
 * @param bbox An array containing the bounding box coordinates [minLng, minLat, maxLng, maxLat]
 * @returns A promise resolving to an array of parcels within the specified bounding box
 */
export async function getParcels(bbox: number[]): Promise<Parcel[]> {
    const { data, error } = await apiClient.GET('/parcels', {
        params: { query: { bbox } },
    })

    if (error) {
        throw error
    }

    return data
}
