import { useEffect, useRef, useState } from 'react'
import { getParcelAtPoint } from './api/parcels'
import ParcelMap from './components/ParcelMap'
import { type ParcelState  } from './components/ParcelPanel' 
import ParcelPanel from './components/ParcelPanel'

function App() {
  const [panel, setPanel] = useState<ParcelState | null>(null)
  const [isPanelOpen, setIsPanelOpen] = useState(false)
  const requestId = useRef(0)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    requestId.current += 1
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
  }, [])

  function handleParcelClick(longitude: number, latitude: number) {
    if (closeTimer.current !== null) clearTimeout(closeTimer.current)
    closeTimer.current = null
    const currentRequest = ++requestId.current
    setPanel({ status: 'loading' })
    setIsPanelOpen(true)
    void getParcelAtPoint(longitude, latitude)
      .then((parcels) => {
        if (requestId.current === currentRequest) setPanel({ status: 'success', parcels })
      })
      .catch(() => {
        if (requestId.current === currentRequest) setPanel({ status: 'error' })
      })
  }

  function closePanel() {
    requestId.current += 1
    setIsPanelOpen(false)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setPanel(null)
    } else {
      closeTimer.current = setTimeout(() => {
        setPanel(null)
        closeTimer.current = null
      }, 350)
    }
  }

  return (
    <div className="relative flex h-dvh w-full overflow-hidden bg-gray-100">
      <main className="min-w-0 flex-1">
        <ParcelMap onParcelClick={handleParcelClick} />
      </main>
      <aside
        aria-hidden={!isPanelOpen}
        inert={!isPanelOpen}
        className={`${panel ? 'block' : 'hidden'} parcel-panel-shell ${isPanelOpen ? 'is-open' : ''} absolute inset-0 z-10 overflow-hidden md:relative md:inset-auto md:shrink-0`}
        onTransitionEnd={(event) => {
          if (!isPanelOpen && event.propertyName === 'transform' && event.target instanceof HTMLElement && event.target.classList.contains('parcel-panel')) {
            if (closeTimer.current !== null) clearTimeout(closeTimer.current)
            closeTimer.current = null
            setPanel(null)
          }
        }}
      >
        {panel && <ParcelPanel state={panel} onClose={closePanel} />}
      </aside>
    </div>
  )
}

export default App