"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent } from "./ui/components/card"
import { Badge } from "./ui/components/badge"

interface AlgaeSpecies {
  "Algae species": string
  "Wikipedia Links": string
  "Algae Base Links": string
  "Number of co's": string
  Producers: string
  Genus: string
  Color: string
  "Common name": string
}

interface AlgaeMapProps {
  data: AlgaeSpecies[]
}

// Mock producer locations - in a real app, you would use a geocoding API or database
const producerLocations: Record<string, { lat: number; lng: number }> = {
  "SeaExpert Azores": { lat: 37.7412, lng: -25.6756 },
  AlgaPlus: { lat: 40.6405, lng: -8.6538 },
  "Seaweed Energy Solutions": { lat: 63.4305, lng: 10.3951 },
  "Ocean Harvest Technology": { lat: 53.2707, lng: -9.0568 },
  Algaia: { lat: 48.6392, lng: -2.0283 },
  Algaplus: { lat: 40.6405, lng: -8.6538 },
  "Seaweed & Co": { lat: 55.9533, lng: -3.1883 },
  Algolesko: { lat: 48.1113, lng: -3.0244 },
  "C-Weed Aquaculture": { lat: 51.5074, lng: -0.1278 },
  "Kelp Blue": { lat: -22.9576, lng: 14.5053 },
  "Seagrass Tech": { lat: 13.0827, lng: 80.2707 },
  Algalimento: { lat: 41.1579, lng: -8.6291 },
}

export default function AlgaeMap({ data }: AlgaeMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [selectedProducer, setSelectedProducer] = useState<string | null>(null)
  const [producerSpecies, setProducerSpecies] = useState<AlgaeSpecies[]>([])

  // Extract unique producers from data
  const producers = [
    ...new Set(
      data.flatMap((item) =>
        item.Producers
          ? item.Producers.split(",")
              .map((p) => p.trim())
              .filter(Boolean)
          : [],
      ),
    ),
  ]

  // Filter species by selected producer
  useEffect(() => {
    if (selectedProducer) {
      const filtered = data.filter((item) => item.Producers && item.Producers.includes(selectedProducer))
      setProducerSpecies(filtered)
    } else {
      setProducerSpecies([])
    }
  }, [selectedProducer, data])

  // Render map (simplified version - in a real app, use a mapping library like Leaflet or Mapbox)
  useEffect(() => {
    if (!mapRef.current) return

    const canvas = document.createElement("canvas")
    canvas.width = mapRef.current.clientWidth
    canvas.height = mapRef.current.clientHeight
    mapRef.current.innerHTML = ""
    mapRef.current.appendChild(canvas)

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Draw simplified world map background
    ctx.fillStyle = "#e5e7eb"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw grid lines
    ctx.strokeStyle = "#d1d5db"
    ctx.lineWidth = 0.5

    // Draw horizontal lines
    for (let i = 0; i < canvas.height; i += 40) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(canvas.width, i)
      ctx.stroke()
    }

    // Draw vertical lines
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, canvas.height)
      ctx.stroke()
    }

    // Function to convert lat/lng to x/y coordinates on the canvas
    const latLngToPoint = (lat: number, lng: number) => {
      // Simple Mercator projection
      const x = (lng + 180) * (canvas.width / 360)
      const latRad = (lat * Math.PI) / 180
      const mercN = Math.log(Math.tan(Math.PI / 4 + latRad / 2))
      const y = canvas.height / 2 - (canvas.width * mercN) / (2 * Math.PI)
      return { x, y }
    }

    // Draw producers on the map
    Object.entries(producerLocations).forEach(([producer, { lat, lng }]) => {
      if (producers.includes(producer)) {
        const { x, y } = latLngToPoint(lat, lng)

        // Draw circle
        ctx.beginPath()
        ctx.arc(x, y, selectedProducer === producer ? 8 : 6, 0, 2 * Math.PI)
        ctx.fillStyle = selectedProducer === producer ? "#2563eb" : "#60a5fa"
        ctx.fill()

        // Draw label
        if (selectedProducer === producer) {
          ctx.font = "bold 12px sans-serif"
          ctx.fillStyle = "#1e3a8a"
          ctx.textAlign = "center"
          ctx.fillText(producer, x, y - 12)
        }
      }
    })

    // Add click handler to select producer
    const handleCanvasClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect()
      const clickX = e.clientX - rect.left
      const clickY = e.clientY - rect.top

      // Check if click is near any producer
      let closestProducer = null
      let closestDistance = Number.POSITIVE_INFINITY

      Object.entries(producerLocations).forEach(([producer, { lat, lng }]) => {
        if (producers.includes(producer)) {
          const { x, y } = latLngToPoint(lat, lng)
          const distance = Math.sqrt(Math.pow(clickX - x, 2) + Math.pow(clickY - y, 2))

          if (distance < 15 && distance < closestDistance) {
            closestProducer = producer
            closestDistance = distance
          }
        }
      })

      setSelectedProducer(closestProducer)
    }

    canvas.addEventListener("click", handleCanvasClick)

    return () => {
      canvas.removeEventListener("click", handleCanvasClick)
    }
  }, [selectedProducer])

  return (
    <div className="h-full flex flex-col">
      <div className="text-sm text-muted-foreground mb-2">
        Note: This is a simplified map visualization. Click on a producer location to see their algae species.
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 relative rounded-md overflow-hidden border" ref={mapRef}>
          {/* Map will be rendered here */}
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">Loading map...</div>
        </div>
        <div className="overflow-auto">
          <Card className="h-full">
            <CardContent className="p-4">
              {selectedProducer ? (
                <>
                  <h3 className="font-semibold text-lg mb-2">{selectedProducer}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{producerSpecies.length} algae species</p>
                  <div className="space-y-2">
                    {producerSpecies.map((species, index) => (
                      <div key={index} className="p-2 border rounded-md">
                        <div className="font-medium">{species["Algae species"]}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{species.Genus}</Badge>
                          <Badge
                            variant="outline"
                            className="flex items-center gap-1"
                            style={{
                              backgroundColor:
                                species.Color === "Green"
                                  ? "#4ade80"
                                  : species.Color === "Red"
                                    ? "#f87171"
                                    : species.Color === "Brown"
                                      ? "#92400e"
                                      : species.Color === "Blue"
                                        ? "#60a5fa"
                                        : species.Color === "Yellow"
                                          ? "#facc15"
                                          : "#d1d5db",
                              color: species.Color === "Brown" ? "white" : "inherit",
                            }}
                          >
                            {species.Color}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-4">
                  <p className="text-muted-foreground">
                    Click on a producer location on the map to see their algae species
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

