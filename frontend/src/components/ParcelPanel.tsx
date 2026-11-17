import type { ParcelDetails } from '../api/parcels'

export type ParcelState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'success'; parcels: ParcelDetails[] }

const labels: Record<string, string> = {
  label: 'Parcel number',
  areaValue: 'Area',
  administrativeUnit: 'Municipality',
  zoning: 'Cadastral area',
  landType: 'Parcel kind',
}

function displayLabel(name: string): string {
  return labels[name] ?? name.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/^./, (letter) => letter.toUpperCase())
}

export default function ParcelPanel({ state, onClose }: { state: ParcelState; onClose: () => void }) {
  return (
    <section aria-labelledby="parcel-panel-title" className="parcel-panel flex h-full flex-col overflow-hidden border-l border-gray-200 bg-white shadow-xl md:w-96">
      <header className="flex shrink-0 items-center justify-between gap-4 border-b border-gray-200 px-6 py-5">
        <div>
          <p className="text-xs font-semibold uppercase text-teal-700">Cadastre</p>
          <h1 id="parcel-panel-title" className="mt-1 text-xl font-semibold text-gray-900">Parcel details</h1>
        </div>
        <button type="button" onClick={onClose} className="rounded border border-gray-300 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700">
          Close
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5" aria-live="polite">
        {state.status === 'loading' && <p className="text-sm text-gray-600">Loading parcel details...</p>}
        {state.status === 'error' && <p className="text-sm text-red-700" role="alert">Unable to load parcel details. Please try again.</p>}
        {state.status === 'success' && state.parcels.length === 0 && <p className="text-sm text-gray-600">No parcel found at this location.</p>}
        {state.status === 'success' && state.parcels.map((parcel, index) => (
          <div key={`${parcel.id}-${index}`} className="mb-6 last:mb-0">
            {state.parcels.length > 1 && <h2 className="mb-3 text-base font-semibold text-gray-900">Parcel {index + 1}</h2>}
            <dl className="divide-y divide-gray-100">
              {parcel.properties.map((property, propertyIndex) => (
                <div key={`${property.name}-${propertyIndex}`} className="py-3 first:pt-0">
                  <dt className="text-xs font-semibold uppercase text-gray-500">{displayLabel(property.name)}</dt>
                  <dd className="mt-1 break-words text-sm text-gray-900">{property.name === 'landType' ? property.value.replace(/([a-z])([A-Z])/g, '$1 $2') : property.value}{property.name === 'areaValue' ? ' m²' : ''}</dd>
                </div>
              ))}
            </dl>
          </div>
        ))}
      </div>
    </section>
  )
}