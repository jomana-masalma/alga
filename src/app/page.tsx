import { AlgaeDataProvider } from "@/components/algae-data-provider"
import { MapDataProvider } from "@/components/map-data-provider"
import Dashboard from "@/components/dashboard"
import 'leaflet/dist/leaflet.css';


export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <AlgaeDataProvider>
        <MapDataProvider>
          <Dashboard />
        </MapDataProvider>
      </AlgaeDataProvider>
    </main>
  )
}
