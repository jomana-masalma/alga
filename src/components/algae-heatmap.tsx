"use client"

import { useEffect, useRef, useState } from "react"
import dynamic from "next/dynamic"
import L from "leaflet"
import "leaflet/dist/leaflet.css"
import { useMapData } from "@/components/map-data-provider"

// Dynamically import MapContainer with no SSR
const MapContainer = dynamic(() => import("react-leaflet").then(mod => mod.MapContainer), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    </div>
  )
})

const TileLayer = dynamic(() => import("react-leaflet").then(mod => mod.TileLayer), { ssr: false })

// Constants for hexagon grid
const HEX_SIZE = 5; // Smaller hexagon size to match image
const HEX_RATIO = Math.sqrt(3) / 2; // Height to width ratio for regular hexagon
const HEX_WIDTH = HEX_SIZE * 2;
const HEX_HEIGHT = HEX_WIDTH * HEX_RATIO;
const INITIAL_ZOOM = 2;
const BASE_GRID_SIZE = 5; // Smaller grid size for denser packing

// Create a custom hexagon icon
const createHexagonIcon = (count: number) => {
  let color;
  if (count <= 2) {
    color = '#FFE600'; // bright yellow
  } else if (count <= 4) {
    color = '#FFA500'; // orange
  } else {
    color = '#FF4500'; // red-orange
  }

  // Calculate points for perfect regular hexagon
  const h = HEX_HEIGHT / 2;
  const w = HEX_WIDTH / 2;
  const points = [
    [w, 0],          // top
    [HEX_WIDTH, h/2], // top right
    [HEX_WIDTH, h*1.5], // bottom right
    [w, HEX_HEIGHT],  // bottom
    [0, h*1.5],      // bottom left
    [0, h/2]         // top left
  ].map(point => point.join(',')).join(' ');

  const svg = `
    <svg width="${HEX_WIDTH}" height="${HEX_HEIGHT}" viewBox="0 0 ${HEX_WIDTH} ${HEX_HEIGHT}" xmlns="http://www.w3.org/2000/svg">
      <polygon points="${points}" fill="${color}" />
    </svg>
  `;

  return L.divIcon({
    html: svg,
    className: 'hexagon-icon',
    iconSize: [HEX_WIDTH, HEX_HEIGHT],
    iconAnchor: [HEX_WIDTH/2, HEX_HEIGHT/2]
  });
};

// Calculate grid position using axial coordinates for perfect hexagonal tiling
const calculateHexPosition = (lat: number, lng: number, zoom: number) => {
  // Adjust grid size based on zoom level
  const gridSize = BASE_GRID_SIZE * Math.pow(2, INITIAL_ZOOM - zoom);

  // Convert to axial coordinates (q,r) for perfect hexagonal grid
  const q = Math.round(lng / (gridSize * HEX_RATIO));
  const r = Math.round(lat / gridSize - (q / 2));

  // Convert axial coordinates back to lat/lng
  return {
    lat: (r + q/2) * gridSize,
    lng: q * gridSize * HEX_RATIO
  };
};

export default function AlgaeHeatmap() {
  const mapRef = useRef<L.Map | null>(null)
  const { occurrences } = useMapData()
  const markersRef = useRef<L.LayerGroup | null>(null)
  const [isMapReady, setIsMapReady] = useState(false)

  useEffect(() => {
    if (!mapRef.current || !occurrences || occurrences.length === 0) {
      return
    }

    const updateHexagons = () => {
      if (!mapRef.current) return;

      if (markersRef.current) {
        mapRef.current.removeLayer(markersRef.current)
      }

      const zoom = mapRef.current.getZoom();
      const markers = L.layerGroup();
      markersRef.current = markers;

      // Create a grid to aggregate points
      const grid = new Map<string, number>();

      // Aggregate points into grid cells
      occurrences.forEach(occ => {
        const hexPos = calculateHexPosition(occ.decimalLatitude, occ.decimalLongitude, zoom);
        const key = `${hexPos.lat.toFixed(6)},${hexPos.lng.toFixed(6)}`;
        grid.set(key, (grid.get(key) || 0) + 1);
      });

      // Create hexagonal markers
      grid.forEach((count, key) => {
        const [lat, lng] = key.split(',').map(Number);
        const hexIcon = createHexagonIcon(count);

        L.marker([lat, lng], {
          icon: hexIcon,
          interactive: false,
          pane: 'markerPane'
        }).addTo(markers);
      });

      markers.addTo(mapRef.current);
    };

    updateHexagons();

    const map = mapRef.current;
    map.on('zoomend', updateHexagons);

    return () => {
      if (map) {
        map.off('zoomend', updateHexagons);
        if (markersRef.current) {
          map.removeLayer(markersRef.current);
        }
      }
    };
  }, [occurrences, isMapReady]);

  return (
    <div className="h-full w-full">
      <MapContainer
        center={[20, 0]}
        zoom={INITIAL_ZOOM}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
        whenReady={() => setIsMapReady(true)}
        className="dark-map"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.gbif.org">GBIF</a>'
          url="https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png"
        />
      </MapContainer>
      <style jsx global>{`
        .dark-map {
          background-color: #004d4d;
        }
        .dark-map .leaflet-tile-pane {
          filter: hue-rotate(180deg) saturate(1.5) brightness(0.7);
        }
        .dark-map .leaflet-control-attribution {
          background: rgba(0, 77, 77, 0.8);
          color: #fff;
        }
        .dark-map .leaflet-control-attribution a {
          color: #9999cc;
        }
        .hexagon-icon {
          background: none;
          border: none;
        }
        .dark-map .leaflet-container {
          background: #8B9DC3;
        }
      `}</style>
    </div>
  )
}
