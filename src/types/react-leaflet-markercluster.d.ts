declare module 'react-leaflet-markercluster' {
  import { ReactNode } from 'react'

  interface MarkerClusterGroupProps {
    children?: ReactNode
    chunkedLoading?: boolean
    spiderfyDistanceMultiplier?: number
    showCoverageOnHover?: boolean
    zoomToBoundsOnClick?: boolean
    maxClusterRadius?: number
    disableClusteringAtZoom?: number
  }

  const MarkerClusterGroup: React.FC<MarkerClusterGroupProps>
  export default MarkerClusterGroup
}