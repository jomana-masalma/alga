"use client"

import { useEffect, useState, useCallback, useRef, useMemo } from "react"
import dynamic from "next/dynamic"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import debounce from "lodash/debounce"

import { fetchTaxonKey, fetchGBIFOccurrences, type GBIFOccurrence } from "@/services/gbif-occurrences"
import { useAlgaeData } from "@/components/algae-data-provider"
import { AlertCircle, ChevronDown, ChevronUp, Loader2, MapPin, Filter, Info } from "lucide-react"
import { Button } from "@/components/button"

// Lazy load map components
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <div className="h-full w-full flex items-center justify-center">Loading map...</div>
})
const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Tooltip = dynamic(() => import("react-leaflet").then(mod => mod.Tooltip), { ssr: false })

interface SpeciesStatus {
  name: string
  status: 'loading' | 'success' | 'error'
  error?: string
}

// Cache for GBIF data
const gbifCache = new Map<string, { taxonKey: number | null, occurrences: GBIFOccurrence[] }>()

export default function AlgaeMap() {
  const [occurrences, setOccurrences] = useState<GBIFOccurrence[]>([])
  const [loading, setLoading] = useState(true)
  const [speciesStatus, setSpeciesStatus] = useState<SpeciesStatus[]>([])
  const mapRef = useRef<any>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const {
    filteredData,
    searchTerm,
    selectedGenus,
    selectedColor,
    selectedProducer,
    setFailedSpecies,
    setSpeciesWithGBIFData,
    isErrorPanelExpanded,
    setIsErrorPanelExpanded
  } = useAlgaeData()

  // Memoize unique species names
  const speciesNames = useMemo(() => {
    return [...new Set(filteredData.map(item => item["Algae species"]))]
      .filter(name => name && name.trim() !== '')
  }, [filteredData])

  // ✅ Custom Marker Icon Setup (once on client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      delete (L.Icon.Default.prototype as any)._getIconUrl
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl: "/leaflet/marker-icon.png",
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      })
    }
  }, [])

  // Debounced load occurrences function
  const debouncedLoadOccurrences = useCallback(
    debounce(async () => {
      if (!mapRef.current) return

      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      abortControllerRef.current = new AbortController()

      setLoading(true)
      setFailedSpecies([])
      setSpeciesWithGBIFData([])

      if (speciesNames.length === 0) {
        setLoading(false)
        return
      }

      const speciesStatus: Record<string, boolean> = {}
      const newOccurrences: GBIFOccurrence[] = []
      const successfulSpecies: string[] = []

      // Process species in batches to avoid overwhelming the API
      const batchSize = 5
      for (let i = 0; i < speciesNames.length; i += batchSize) {
        const batch = speciesNames.slice(i, i + batchSize)
        await Promise.all(
          batch.map(async (speciesName) => {
            try {
              // Check cache first
              const cachedData = gbifCache.get(speciesName)
              if (cachedData) {
                if (cachedData.taxonKey && cachedData.occurrences.length > 0) {
                  newOccurrences.push(...cachedData.occurrences)
                  speciesStatus[speciesName] = true
                  successfulSpecies.push(speciesName)
                } else {
                  speciesStatus[speciesName] = false
                  setFailedSpecies(prev => [...prev, { name: speciesName, error: 'No occurrences found' }])
                }
                return
              }

              const taxonKey = await fetchTaxonKey(speciesName)
              if (taxonKey) {
                const occurrences = await fetchGBIFOccurrences(taxonKey)
                if (occurrences && occurrences.length > 0) {
                  newOccurrences.push(...occurrences)
                  speciesStatus[speciesName] = true
                  successfulSpecies.push(speciesName)
                  // Cache successful results
                  gbifCache.set(speciesName, { taxonKey, occurrences })
                } else {
                  speciesStatus[speciesName] = false
                  setFailedSpecies(prev => [...prev, { name: speciesName, error: 'No occurrences found' }])
                  // Cache failed results
                  gbifCache.set(speciesName, { taxonKey, occurrences: [] })
                }
              } else {
                speciesStatus[speciesName] = false
                setFailedSpecies(prev => [...prev, { name: speciesName, error: 'Species not found in GBIF' }])
                // Cache failed results
                gbifCache.set(speciesName, { taxonKey: null, occurrences: [] })
              }
            } catch (error) {
              if (error instanceof Error && error.name === 'AbortError') return
              console.error(`Error fetching data for ${speciesName}:`, error)
              speciesStatus[speciesName] = false
              setFailedSpecies(prev => [...prev, { name: speciesName, error: 'Error fetching data' }])
            }
          })
        )
      }

      setSpeciesWithGBIFData(successfulSpecies)
      setOccurrences(newOccurrences)
      setLoading(false)
    }, 500),
    [speciesNames, setFailedSpecies, setSpeciesWithGBIFData]
  )

  // Load occurrences when species names change
  useEffect(() => {
    debouncedLoadOccurrences()
    return () => {
      debouncedLoadOccurrences.cancel()
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [debouncedLoadOccurrences])

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return occurrences.map((occ, index) => (
      <Marker
        key={`${occ.key}-${occ.scientificName}-${index}`}
        position={[occ.decimalLatitude, occ.decimalLongitude]}
      >
        <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
          <div className="text-xs max-w-[200px]">
            <strong>{occ.scientificName}</strong>
            {occ.eventDate && <div>🗓️ {occ.eventDate}</div>}
            {occ.media?.[0]?.identifier && (
              <img
                src={occ.media[0].identifier}
                alt={occ.media[0].title || "Algae image"}
                className="mt-1 rounded max-w-[180px]"
                loading="lazy"
              />
            )}
          </div>
        </Tooltip>
      </Marker>
    ))
  }, [occurrences])

  const getFilterSummary = () => {
    const filters = []
    if (searchTerm) filters.push(`Search: "${searchTerm}"`)
    if (selectedGenus !== 'all') filters.push(`Genus: ${selectedGenus}`)
    if (selectedColor !== 'all') filters.push(`Color: ${selectedColor}`)
    if (selectedProducer !== 'all') filters.push(`Producer: ${selectedProducer}`)
    return filters.join(' | ')
  }

  const failedSpecies = speciesStatus.filter(s => s.status === 'error')
  const loadingSpecies = speciesStatus.filter(s => s.status === 'loading')

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.gbif.org">GBIF</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {markers}
      </MapContainer>

      {/* Map Legend - Fixed position */}
      <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border">
        <div className="font-medium mb-2 flex items-center">
          <MapPin className="w-4 h-4 mr-1" />
          Map Legend
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
            <span>Producer Location</span>
          </div>
          <div className="flex items-center text-sm">
            <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
            <span>Multiple Species</span>
          </div>
        </div>
      </div>
    </div>
  )
}
