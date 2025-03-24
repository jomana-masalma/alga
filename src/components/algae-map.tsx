"use client"

import { useEffect } from "react"
import dynamic from 'next/dynamic'
import { dataHelpers } from '@/services/algae-data-service'
import type { AlgaeSpecies } from '@/lib/data-processor'
import { parseProducers } from '@/lib/data-processor'

// Dynamically import Leaflet components with no SSR
const MapContainer = dynamic(
  () => import('react-leaflet').then((mod) => mod.MapContainer),
  { ssr: false }
)
const TileLayer = dynamic(
  () => import('react-leaflet').then((mod) => mod.TileLayer),
  { ssr: false }
)
const Marker = dynamic(
  () => import('react-leaflet').then((mod) => mod.Marker),
  { ssr: false }
)
const Popup = dynamic(
  () => import('react-leaflet').then((mod) => mod.Popup),
  { ssr: false }
)

export default function AlgaeMap({ data }: { data: AlgaeSpecies[] }) {
  // Fix for Leaflet marker icons in Next.js
  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      const L = require('leaflet');
      delete L.Icon.Default.prototype._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: '/leaflet/marker-icon-2x.png',
        iconUrl: '/leaflet/marker-icon.png',
        shadowUrl: '/leaflet/marker-shadow.png',
      });
    }
  }, []);

  // Get unique producers from the filtered data
  const producers = new Set<string>();
  data.forEach(item => {
    if (item.Producers) {
      parseProducers(item.Producers).forEach(producer => producers.add(producer));
    }
  });

  // Get producer locations
  const producerLocations = Array.from(producers)
    .map(producer => dataHelpers.getProducerDetails(producer))
    .filter(producer => producer.location !== null);

  return (
    <div className="h-full w-full relative">
      {typeof window !== 'undefined' && (
        <>
          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur-sm p-3 rounded-lg shadow-sm border text-sm">
            <p className="font-medium mb-1">Map Legend</p>
            <div className="flex items-center mb-1">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Producer Location</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Multiple Species</span>
            </div>
          </div>
          <MapContainer
            center={[20, 0]}
            zoom={2}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {producerLocations.map((producer, index) => (
              producer.location && (
                <Marker
                  key={index}
                  position={[producer.location.lat, producer.location.lng]}
                >
                  <Popup>
                    <div>
                      <h3 className="font-medium">{producer.name}</h3>
                      <p className="text-sm">
                        Species count: {
                          data.filter(item =>
                            item.Producers && parseProducers(item.Producers).includes(producer.name)
                          ).length
                        }
                      </p>
                    </div>
                  </Popup>
                </Marker>
              )
            ))}
          </MapContainer>
        </>
      )}
    </div>
  );
}
