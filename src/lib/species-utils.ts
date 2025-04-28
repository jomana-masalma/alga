import type { AlgaeSpecies } from "@/lib/data-processor"

export function normalizeSpeciesName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // Remove author citations in parentheses
    .replace(/\([^)]*\)/g, '')
    // Remove anything after a comma (usually year or author)
    .replace(/,.*$/, '')
    // Remove 'var.', 'f.', 'subsp.' and similar taxonomic rank indicators
    .replace(/\b(var|f|subsp|ssp|subspecies|forma|variety)\b\s*\./g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    .trim()
}

export function getGenusAndSpecies(name: string): { genus: string; species: string | null } {
  const parts = name.split(' ')
  return {
    genus: parts[0],
    species: parts.length > 1 ? parts[1] : null
  }
}

export function findMatchingAlgaeData(gbifName: string, filteredData: AlgaeSpecies[]): AlgaeSpecies | null {
  const normalizedGbif = normalizeSpeciesName(gbifName)
  const gbifParts = getGenusAndSpecies(normalizedGbif)

  let bestMatch: { score: number; data: AlgaeSpecies | null } = { score: 0, data: null }

  for (const algae of filteredData) {
    const normalizedAlgae = normalizeSpeciesName(algae["Algae species"])
    const algaeParts = getGenusAndSpecies(normalizedAlgae)

    let score = 0

    // Exact match gets highest score
    if (normalizedAlgae === normalizedGbif) {
      score = 100
    }
    // Genus and species match
    else if (gbifParts.genus === algaeParts.genus && gbifParts.species === algaeParts.species) {
      score = 90
    }
    // Only genus matches
    else if (gbifParts.genus === algaeParts.genus) {
      score = 50
    }
    // GBIF name starts with algae name (handling subspecies/varieties)
    else if (normalizedGbif.startsWith(normalizedAlgae)) {
      score = 80
    }
    // Algae name starts with GBIF name
    else if (normalizedAlgae.startsWith(normalizedGbif)) {
      score = 70
    }

    if (score > bestMatch.score) {
      bestMatch = { score, data: algae }
    }
  }

  // Only return matches with a minimum score
  return bestMatch.score >= 50 ? bestMatch.data : null
}