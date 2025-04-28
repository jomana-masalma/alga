"use client"

import { useEffect, useRef, useMemo, memo, useState, Suspense } from "react"
import dynamic from "next/dynamic"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import "leaflet.markercluster/dist/MarkerCluster.css"
import "leaflet.markercluster/dist/MarkerCluster.Default.css"
import { Link2, MapPin } from "lucide-react"

import { useAlgaeData } from "@/components/algae-data-provider"
import { useMapData } from "@/components/map-data-provider"
import type { AlgaeSpecies } from "@/lib/data-processor"
import type { GBIFOccurrence } from "@/types/gbif-types"
import { findMatchingAlgaeData } from "@/lib/species-utils"

// Lazy load heavy components
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading map..." />
})

const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })
const Marker = dynamic(() => import("react-leaflet").then(mod => mod.Marker), { ssr: false })
const Popup = dynamic(() => import("react-leaflet").then(mod => mod.Popup), { ssr: false })

// Lazy load image component
const ImageWithFallback = dynamic(() => import("@/components/image-with-fallback"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-full bg-gray-50">
      <div className="animate-pulse w-full h-full bg-gray-200" />
    </div>
  )
})

// Dynamically import MarkerClusterGroup with SSR handling
const MarkerClusterGroup = dynamic(
  () => import("react-leaflet-markercluster").then(mod => mod.default),
  {
    ssr: false,
    loading: () => null
  }
) as React.ComponentType<{
  children: React.ReactNode;
  chunkedLoading?: boolean;
  spiderfyDistanceMultiplier?: number;
  showCoverageOnHover?: boolean;
  zoomToBoundsOnClick?: boolean;
  maxClusterRadius?: number;
  disableClusteringAtZoom?: number;
}>

// Loading spinner component
const LoadingSpinner = ({ message }: { message: string }) => (
  <div className="h-full w-full flex items-center justify-center">
    <div className="text-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-2"></div>
      <p className="text-muted-foreground">{message}</p>
    </div>
  </div>
)

// Memoized marker tooltip component
const MarkerTooltip = memo(({ occ, algaeData }: { occ: GBIFOccurrence; algaeData: AlgaeSpecies | null }) => {
  const [isImageLoaded, setIsImageLoaded] = useState(true)

  return (
    <Popup
      className="leaflet-popup-custom"
      closeButton={false}
      autoClose={false}
      closeOnClick={false}
      maxWidth={250}
      offset={[0, -10]}
    >
      <div className="text-xs w-[250px] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
        <div className="font-semibold mb-2 break-all leading-tight">
          {occ.scientificName}
          {algaeData?.["Common name"] && (
            <span className="font-normal text-gray-600 block">
              {algaeData["Common name"]}
            </span>
          )}
        </div>
        {occ.eventDate && (
          <div className="text-gray-600 mb-2 flex items-center gap-1">
            <span className="shrink-0">🗓️</span>
            <span>{new Date(occ.eventDate).toLocaleDateString()}</span>
          </div>
        )}
        {occ.media?.[0]?.identifier && isImageLoaded && (
          <div className="relative w-full h-[120px] bg-gray-100 rounded-md overflow-hidden mb-2">
            <Suspense fallback={<div className="animate-pulse w-full h-full bg-gray-200" />}>
              <ImageWithFallback
                src={occ.media[0].identifier}
                alt={occ.media[0].title || `${occ.scientificName} image`}
                onError={() => setIsImageLoaded(false)}
              />
            </Suspense>
          </div>
        )}
        <div className="text-gray-600 flex items-start gap-1 mb-2">
          <span className="shrink-0">📍</span>
          <span className="break-words">
            {`${occ.decimalLatitude.toFixed(4)}, ${occ.decimalLongitude.toFixed(4)}`}
          </span>
        </div>
        {algaeData && (
          <div className="border-t pt-2 space-y-1">
            {algaeData["Wikipedia Links"] && (
              <a
                href={algaeData["Wikipedia Links"]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
              >
                <Link2 className="w-3 h-3" />
                <span>View on Wikipedia</span>
              </a>
            )}
            {algaeData["Algae Base Links"] && (
              <a
                href={algaeData["Algae Base Links"]}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
              >
                <Link2 className="w-3 h-3" />
                <span>View on AlgaeBase</span>
              </a>
            )}
          </div>
        )}
      </div>
    </Popup>
  )
})

MarkerTooltip.displayName = 'MarkerTooltip'

// Memoized marker component
const MapMarker = memo(({ occ, algaeData }: { occ: GBIFOccurrence; algaeData: AlgaeSpecies | null }) => {
  const markerRef = useRef<L.Marker | null>(null)

  useEffect(() => {
    if (markerRef.current) {
      const marker = markerRef.current
      console.log('Marker mounted:', marker)

      // Create popup content
      const content = `
        <div class="text-xs w-[250px] bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-3 border border-gray-200">
          <div class="font-semibold mb-2 break-all leading-tight">
            ${occ.scientificName}
            ${algaeData?.["Common name"] ? `
              <span class="font-normal text-gray-600 block">
                ${algaeData["Common name"]}
              </span>
            ` : ''}
          </div>
          ${occ.eventDate ? `
            <div class="text-gray-600 mb-2 flex items-center gap-1">
              <span class="shrink-0">🗓️</span>
              <span>${new Date(occ.eventDate).toLocaleDateString()}</span>
            </div>
          ` : ''}
          ${occ.media?.[0]?.identifier ? `
            <div class="relative w-full h-[120px] bg-gray-100 rounded-md overflow-hidden mb-2">
              <img
                src="${occ.media[0].identifier}"
                alt="${occ.media[0].title || `${occ.scientificName} image`}"
                class="w-full h-full object-cover"
                onerror="this.onerror=null; this.parentElement.style.display='none';"
              />
            </div>
          ` : ''}
          <div class="text-gray-600 flex items-start gap-1 mb-2">
            <span class="shrink-0">📍</span>
            <span class="break-words">
              ${occ.decimalLatitude.toFixed(4)}, ${occ.decimalLongitude.toFixed(4)}
            </span>
          </div>
          ${algaeData ? `
            <div class="border-t pt-2 space-y-2">
              ${algaeData["Wikipedia Links"] ? `
                <a href="${algaeData["Wikipedia Links"]}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <path d="M2 12h20"></path>
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                  </svg>
                  <span>Wikipedia</span>
                </a>
              ` : ''}
              ${algaeData["Algae Base Links"] ? `
                <a href="${algaeData["Algae Base Links"]}" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
                  <svg class="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10.75 10"></path>
                    <path d="M2 21c0-3 1.85-5.36 5.08-6C6.6 15.18 4 14 4 11.85a4.82 4.82 0 0 1 .29-2.7C3.36 8.77 2 10.18 2 13"></path>
                  </svg>
                  <span>AlgaeBase</span>
                </a>
              ` : ''}
            </div>
          ` : ''}
        </div>
      `

      // Bind popup to marker with proper options
      marker.bindPopup(content, {
        className: 'leaflet-popup-custom',
        closeButton: true, // Enable close button
        autoClose: true, // Allow auto-closing when clicking elsewhere
        closeOnClick: true, // Close when clicking the map
        maxWidth: 250,
        offset: [0, -10]
      })

      return () => {
        marker.unbindPopup()
      }
    }
  }, [occ, algaeData])

  return (
    <Marker
      position={[occ.decimalLatitude, occ.decimalLongitude]}
      ref={markerRef}
    />
  )
})

MapMarker.displayName = 'MapMarker'

// Map legend component
const MapLegend = memo(() => (
  <div className="absolute top-2 right-2 z-[1000] bg-white/95 backdrop-blur-sm p-3 rounded-lg shadow-md border">
    <div className="font-medium mb-2 flex items-center">
      <MapPin className="w-4 h-4 mr-1" />
      Map Legend
    </div>
    <div className="space-y-1.5">
      <div className="flex items-center text-sm">
        <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
        <span>Single Location</span>
      </div>
      <div className="flex items-center text-sm">
        <div className="w-6 h-6 flex items-center justify-center bg-blue-500 rounded-full text-white text-xs mr-2">
          <span>n</span>
        </div>
        <span>Clustered Locations</span>
      </div>
      <div className="flex items-center text-sm">
        <div className="w-3 h-3 bg-gradient-to-r from-blue-500 via-cyan-500 to-red-500 mr-2"></div>
        <span>Heatmap Intensity</span>
      </div>
    </div>
  </div>
))

MapLegend.displayName = 'MapLegend'

export default function AlgaeMap() {
  const mapRef = useRef<L.Map | null>(null)
  const { filteredData } = useAlgaeData()
  const { occurrences, isLoading, error } = useMapData()
  const [isMapReady, setIsMapReady] = useState(false)

  // ✅ Custom Marker Icon Setup (once on client)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const iconUrl = "/leaflet/marker-icon.png"
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "/leaflet/marker-icon-2x.png",
        iconUrl,
        shadowUrl: "/leaflet/marker-shadow.png",
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        tooltipAnchor: [16, -28],
        shadowSize: [41, 41],
      })
    }
  }, [])

  // Memoize markers to prevent unnecessary re-renders
  const markers = useMemo(() => {
    return occurrences.map((occ, index) => {
      const algaeData = findMatchingAlgaeData(occ.scientificName, filteredData)
      return (
        <MapMarker
          key={`${occ.key}-${index}`}
          occ={occ}
          algaeData={algaeData}
        />
      )
    })
  }, [occurrences, filteredData])

  if (isLoading) {
    return <LoadingSpinner message="Loading map data..." />
  }

  if (error) {
    return (
      <div className="h-full w-full flex items-center justify-center">
        <div className="text-center text-destructive">
          <p>{error}</p>
          <p className="text-sm text-muted-foreground mt-1">Please try refreshing the page</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full w-full relative">
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        whenReady={() => setIsMapReady(true)}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.gbif.org">GBIF</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {isMapReady && (
          <MarkerClusterGroup
            chunkedLoading
            spiderfyDistanceMultiplier={1}
            showCoverageOnHover
            zoomToBoundsOnClick
            maxClusterRadius={50}
            disableClusteringAtZoom={8}
          >
            {markers}
          </MarkerClusterGroup>
        )}
      </MapContainer>
      <MapLegend />
    </div>
  )
}
