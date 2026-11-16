import { apiClient } from './client'

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
