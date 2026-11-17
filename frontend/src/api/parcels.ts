import { apiClient } from './client'
import type { components } from './schema'

export type ParcelDetails = components['schemas']['ParcelDetails']

export async function getParcelAtPoint(long: number, lat: number): Promise<ParcelDetails[]> {
    const { data, error, response } = await apiClient.GET('/parcels/at-point', {
        params: { query: { long, lat } },
    })

    if (error || !response.ok || !data) {
        throw new Error('Unable to retrieve parcel details.')
    }

    return data
}

/**
 * Retrieves parcels within a specified bounding box.
 * @param bbox An array containing the bounding box coordinates [minLng, minLat, maxLng, maxLat]
 * @returns A promise resolving to an array of parcels within the specified bounding box
 */
export async function getParcels(bbox: number[]): Promise<string[]> {
    const { data, error } = await apiClient.GET('/parcels', {
        params: { query: { bbox } },
    })

    if (error) {
        throw error
    }

    return data
}
