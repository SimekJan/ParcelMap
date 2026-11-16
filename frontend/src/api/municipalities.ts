import { apiClient } from './client'
import type { components } from './schema'

type Municipality = components['schemas']['Municipality']

let municipalitiesRequest: Promise<Municipality[]> | undefined

/**
 * Retrieves a list of municipalities.
 * @returns A promise resolving to an array of municipalities.
 */
export function getMunicipalities(): Promise<Municipality[]> {
  if (!municipalitiesRequest) {
    municipalitiesRequest = apiClient.GET('/municipalities')
      .then(({ data, error }) => {
        if (error) throw error
        return data
      })
      .catch((error: unknown) => {
        municipalitiesRequest = undefined
        throw error
      })
  }

  return municipalitiesRequest
}
