import { apiClient } from './client'
import type { components } from './schema'

type Municipality = components['schemas']['Municipality']

/**
 * Retrieves a list of municipalities.
 * @returns A promise resolving to an array of municipalities.
 */
export async function getMunicipalities(): Promise<Municipality[]> {
  const { data, error } = await apiClient.GET('/municipalities')

  if (error) {
    throw error
  }

  return data
}
