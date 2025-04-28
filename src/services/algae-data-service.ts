// Helper functions for algae data
export const dataHelpers = {
  // Get producer details including location
  getProducerDetails: (producerName: string) => {
    const location = producerLocations[producerName] || null;
    return {
      name: producerName,
      location
    };
  },
};

// Color mapping for algae species
export const algaeColorMap: Record<string, string> = {
  "Green": "#4ade80",
  "Brown": "#92400e",
  "Red": "#ef4444",
  "Blue-green": "#0ea5e9",
  "Golden": "#eab308",
  "Yellow-green": "#84cc16",
  "Variable": "#8b5cf6",
  "Varies": "#8b5cf6",
};

// Producer locations mapping for the map visualization
export const producerLocations: Record<string, { lat: number; lng: number }> = {
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
};
