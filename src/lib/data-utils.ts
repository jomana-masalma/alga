export interface AlgaeSpecies {
  "Algae species": string
  "Wikipedia Links": string
  "Algae Base Links": string
  "Number of co's": string
  Producers: string
  Genus: string
  Color: string
  "Common name": string
  Latitude?: number
  Longitude?: number
}

export function parseCSV(csvText: string): AlgaeSpecies[] {
  const lines = csvText.trim().split("\n")
  const headers = lines[0].split(",")
  const data: AlgaeSpecies[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",")
    const item: any = {}

    for (let j = 0; j < headers.length; j++) {
      item[headers[j].trim()] = values[j] ? values[j].trim() : ""
    }

    // Attempt to parse Latitude and Longitude
    try {
      item.Latitude = Number.parseFloat(item.Latitude)
      item.Longitude = Number.parseFloat(item.Longitude)
    } catch (error) {
      // If parsing fails, leave them as undefined or handle as needed
      item.Latitude = undefined
      item.Longitude = undefined
    }

    data.push(item as AlgaeSpecies)
  }

  return data
}

export const sampleAlgaeData: AlgaeSpecies[] = [
  {
    "Algae species": "Acanthococcus antarcticus",
    "Wikipedia Links": "https://en.wikipedia.org/wiki/Acanthococcus_antarcticus",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=154874",
    "Number of co's": "1",
    Producers: "SeaExpert Azores",
    Genus: "Acanthococcus",
    Color: "Green",
    "Common name": "",
    Latitude: 37.7412,
    Longitude: -25.6756,
  },
  {
    "Algae species": "Acanthococcus erinaceus",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=3824",
    "Number of co's": "0",
    Producers: "AlgaPlus",
    Genus: "Acanthococcus",
    Color: "Red",
    "Common name": "",
    Latitude: 40.6405,
    Longitude: -8.6538,
  },
  {
    "Algae species": "Acinetospora crinita",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=4413",
    "Number of co's": "0",
    Producers: "Seaweed Energy Solutions",
    Genus: "Acinetospora",
    Color: "Brown",
    "Common name": "",
    Latitude: 63.4305,
    Longitude: 10.3951,
  },
  {
    "Algae species": "Acidocella facilis",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=94474",
    "Number of co's": "0",
    Producers: "Ocean Harvest Technology",
    Genus: "Acidocella",
    Color: "Green",
    "Common name": "",
    Latitude: 53.2707,
    Longitude: -9.0568,
  },
  {
    "Algae species": "Acrochaetium secundatum",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=93483",
    "Number of co's": "0",
    Producers: "Algaia",
    Genus: "Acrochaetium",
    Color: "Red",
    "Common name": "",
    Latitude: 48.6392,
    Longitude: -2.0283,
  },
  {
    "Algae species": "Agarophyton vermiculophyllum",
    "Wikipedia Links": "https://en.wikipedia.org/wiki/Gracilaria_vermiculophylla",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=134688",
    "Number of co's": "4",
    Producers: "Algaplus",
    Genus: "Agarophyton",
    Color: "Red",
    "Common name": "Ogonori",
    Latitude: 40.6405,
    Longitude: -8.6538,
  },
  {
    "Algae species": "Aglaothamnion halliae",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=2683",
    "Number of co's": "0",
    Producers: "Seaweed & Co",
    Genus: "Aglaothamnion",
    Color: "Red",
    "Common name": "",
    Latitude: 55.9533,
    Longitude: -3.1883,
  },
  {
    "Algae species": "Algacoccus thalassius",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=94475",
    "Number of co's": "0",
    Producers: "Algolesko",
    Genus: "Algacoccus",
    Color: "Green",
    "Common name": "",
    Latitude: 48.1113,
    Longitude: -3.0244,
  },
  {
    "Algae species": "Amphidinium carterae",
    "Wikipedia Links": "https://en.wikipedia.org/wiki/Amphidinium_carterae",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=3748",
    "Number of co's": "2",
    Producers: "C-Weed Aquaculture",
    Genus: "Amphidinium",
    Color: "Yellow",
    "Common name": "",
    Latitude: 51.5074,
    Longitude: -0.1278,
  },
  {
    "Algae species": "Antithamnionella ternifolia",
    "Wikipedia Links": "",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=6178",
    "Number of co's": "0",
    Producers: "Kelp Blue",
    Genus: "Antithamnionella",
    Color: "Red",
    "Common name": "",
    Latitude: -22.9576,
    Longitude: 14.5053,
  },
  {
    "Algae species": "Arthrospira platensis",
    "Wikipedia Links": "https://en.wikipedia.org/wiki/Arthrospira_platensis",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=4648",
    "Number of co's": "4",
    Producers: "Seagrass Tech",
    Genus: "Arthrospira",
    Color: "Blue",
    "Common name": "Spirulina",
    Latitude: 13.0827,
    Longitude: 80.2707,
  },
  {
    "Algae species": "Asparagopsis armata",
    "Wikipedia Links": "https://en.wikipedia.org/wiki/Asparagopsis_armata",
    "Algae Base Links": "https://www.algaebase.org/search/species/detail/?species_id=2737",
    "Number of co's": "3",
    Producers: "Algalimento",
    Genus: "Asparagopsis",
    Color: "Red",
    "Common name": "Harpoon Weed",
    Latitude: 41.1579,
    Longitude: -8.6291,
  },
]
