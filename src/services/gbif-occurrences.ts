import axios, { AxiosRequestConfig } from 'axios'
import { gbifCache } from '@/lib/gbif-cache'
import { GBIFOccurrence, GBIFSpecies, GBIFSpeciesMatch } from '@/types/gbif-types'

// Custom axios request config type with retry options
interface CustomRequestConfig extends AxiosRequestConfig {
  retry?: number;
  retryDelay?: number;
}

// Create axios instance with timeout configuration
const gbifAxios = axios.create({
  baseURL: 'https://api.gbif.org/v1',
  timeout: 10000, // 10 seconds timeout
})

// Add retry logic with exponential backoff
gbifAxios.interceptors.response.use(undefined, async (error) => {
  const config = error.config as CustomRequestConfig
  if (!config || !config.retry) {
    return Promise.reject(error)
  }

  config.retry -= 1
  if (config.retry === 0) {
    return Promise.reject(error)
  }

  const backoff = new Promise(resolve => {
    setTimeout(() => resolve(null), config.retryDelay || 1000)
  })
  config.retryDelay = (config.retryDelay || 1000) * 2

  await backoff
  return gbifAxios(config)
})

// Global in-memory taxonomic database for common species
const COMMON_TAXA = {
  "Fucus vesiculosus": { usageKey: 2563239, kingdom: "Plantae", phylum: "Phaeophyta" },
  "Saccharina latissima": { usageKey: 2397026, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Laminaria digitata": { usageKey: 2397025, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Ulva lactuca": { usageKey: 2399815, kingdom: "Plantae", phylum: "Chlorophyta" },
  "Porphyra umbilicalis": { usageKey: 2667199, kingdom: "Plantae", phylum: "Rhodophyta" },
  "Alaria esculenta": { usageKey: 2396889, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Palmaria palmata": { usageKey: 2664150, kingdom: "Plantae", phylum: "Rhodophyta" },
  "Himanthalia elongata": { usageKey: 2397056, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Undaria pinnatifida": { usageKey: 2397034, kingdom: "Chromista", phylum: "Ochrophyta" },
  "Ascophyllum nodosum": { usageKey: 2396916, kingdom: "Chromista", phylum: "Ochrophyta" }
}

/**
 * Optimized function to fetch GBIF data
 */
async function fetchGBIFData<T>(endpoint: string, params: Record<string, string | number | boolean | undefined> = {}): Promise<T> {
  try {
    // Filter out undefined values from params
    const filteredParams = Object.fromEntries(
      Object.entries(params).filter(([, value]) => value !== undefined)
    ) as Record<string, string | number | boolean>;

    const config: CustomRequestConfig = {
      params: filteredParams,
      retry: 3,
      retryDelay: 1000,
    }
    const response = await gbifAxios.get(endpoint, config)
    return response.data
  } catch (error) {
    console.error(`Error fetching GBIF data from ${endpoint}:`, error)
    throw error
  }
}

// Cache for API responses to reduce API calls
const speciesMatchCache = new Map<string, GBIFSpeciesMatch>()
const speciesDetailsCache = new Map<number, GBIFSpecies>()
const occurrencesCache = new Map<number, GBIFOccurrence[]>()

// Mapping of taxonomic synonyms to accepted names
// This helps with species that might be in GBIF under a different name
const TAXONOMIC_SYNONYMS: Record<string, string> = {
  // Synonyms for common algae
  "Fucus sp.": "Fucus vesiculosus",
  "Laminaria sp.": "Laminaria digitata",
  "Ulva sp.": "Ulva lactuca",
  "Porphyra sp.": "Porphyra umbilicalis",
  "Chondrus crispus": "Chondrus crispus",
  "Codium fragile": "Codium fragile",
  "Enteromorpha sp.": "Ulva intestinalis", // Enteromorpha is now Ulva
  "Enteromorpha intestinalis": "Ulva intestinalis",
  "Enteromorpha compressa": "Ulva compressa",
  "Laminaria hyperborea": "Laminaria hyperborea",
  "Laminaria saccharina": "Saccharina latissima", // Taxonomic update
  "Sargassum muticum": "Sargassum muticum",
  "Macrocystis pyrifera": "Macrocystis pyrifera",
  "Gracilaria sp.": "Gracilaria gracilis",
  "Gelidium sp.": "Gelidium corneum",
  "Cystoseira sp.": "Cystoseira baccata",
  "Calliblepharis sp.": "Calliblepharis ciliata",
  "Cladophora sp.": "Cladophora rupestris",
  "Mastocarpus stellatus": "Mastocarpus stellatus",
  "Dilsea carnosa": "Dilsea carnosa",
  "Grateloupia turuturu": "Grateloupia turuturu",
  "Chorda filum": "Chorda filum",
  "Bifurcaria bifurcata": "Bifurcaria bifurcata",
  "Ectocarpus sp.": "Ectocarpus siliculosus",
  "Eisenia arborea": "Eisenia arborea",
  "Polysiphonia sp.": "Polysiphonia fucoides",
  "Asparagopsis sp.": "Asparagopsis armata",
  "Ceramium sp.": "Ceramium virgatum",
  "Sphaerotrichia divaricata": "Sphaerotrichia divaricata",
  // Add any additional synonyms here
};

/**
 * Helper function to handle taxonomic synonyms
 */
function resolveSynonym(name: string): string {
  const normalizedName = name.trim();
  return TAXONOMIC_SYNONYMS[normalizedName] || normalizedName;
}

/**
 * Find the best match for a species name using GBIF Species Match API
 * Optimized with predefined common species data
 */
export async function matchSpeciesName(name: string): Promise<GBIFSpeciesMatch | null> {
  if (!name) return null

  // Resolve any known synonyms first
  const resolvedName = resolveSynonym(name);

  // Check for common species first (fastest path)
  const normalizedName = resolvedName.trim();
  if (COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA]) {
    const commonData = COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA];
    const matchData = {
      usageKey: commonData.usageKey,
      scientificName: normalizedName,
      canonicalName: normalizedName,
      kingdom: commonData.kingdom,
      phylum: commonData.phylum,
      rank: "SPECIES",
      status: "ACCEPTED",
      matchType: "EXACT",
      confidence: 100,
      synonym: false,
      // Add other required fields with default values
      kingdomKey: 0,
      phylumKey: 0
    } as GBIFSpeciesMatch;

    speciesMatchCache.set(name.trim().toLowerCase(), matchData);
    return matchData;
  }

  // Check cache first (using original name as key)
  const cacheKey = name.trim().toLowerCase();
  if (speciesMatchCache.has(cacheKey)) {
    return speciesMatchCache.get(cacheKey) || null;
  }

  // If the name was resolved to a synonym and is different
  if (resolvedName !== name) {
    // Try to match the resolved name and cache under the original name
    try {
      const matchResult = await matchSpeciesName(resolvedName);
      if (matchResult) {
        // Store in cache under original name
        speciesMatchCache.set(cacheKey, matchResult);
        return matchResult;
      }
    } catch (error) {
      console.warn(`Error matching resolved synonym ${resolvedName}:`, error);
    }
  }

  // Try to exact match variants (with/without author)
  // This helps catch species names with author info
  if (normalizedName.includes(" ")) {
    const parts = normalizedName.split(" ");
    // If it looks like "Genus species var/f./ssp. something"
    if (parts.length > 2) {
      const simplifiedName = parts.slice(0, 2).join(" ");
      // Check if we have a cached version of the simplified name
      if (speciesMatchCache.has(simplifiedName.toLowerCase())) {
        const match = speciesMatchCache.get(simplifiedName.toLowerCase());
        if (match) {
          speciesMatchCache.set(cacheKey, match);
          return match;
        }
      }
    }
  }

  try {
    console.log(`Attempting to match species name: ${normalizedName}`);
    const data = await fetchGBIFData<GBIFSpeciesMatch>('species/match', { name: normalizedName, verbose: true })

    if (data && data.usageKey) {
      speciesMatchCache.set(cacheKey, data)
      return data
    }

    // Try with fuzzy matching for genus + epithet
    if (normalizedName.includes(" ")) {
      const [genus, ...rest] = normalizedName.split(" ");
      // Try just the genus and first epithet
      const simpleName = `${genus} ${rest[0]}`;

      try {
        console.log(`Attempting fuzzy match for: ${simpleName}`);
        const fuzzyData = await fetchGBIFData<GBIFSpeciesMatch>('species/match', {
          name: simpleName,
          verbose: true,
          strict: false
        });

        if (fuzzyData && fuzzyData.usageKey) {
          // Store under original name but mark confidence lower
          fuzzyData.confidence = Math.min(fuzzyData.confidence, 80);
          speciesMatchCache.set(cacheKey, fuzzyData);
          return fuzzyData;
        }
      } catch (fuzzyError) {
        console.warn(`Fuzzy matching failed for ${simpleName}`, fuzzyError);
      }
    }

    return null
  } catch (error) {
    console.error(`Error matching species name for "${name}":`, error)
    return null
  }
}

/**
 * Get detailed species information using taxonKey
 */
export async function getSpeciesDetails(taxonKey: number): Promise<GBIFSpecies | null> {
  if (!taxonKey) return null

  // Check cache first
  if (speciesDetailsCache.has(taxonKey)) {
    return speciesDetailsCache.get(taxonKey) || null
  }

  try {
    const data = await fetchGBIFData<GBIFSpecies>(`species/${taxonKey}`, { verbose: true })

    if (data && data.key) {
      // Get vernacular names and descriptions if available
      const [vernacularData, descriptionsData] = await Promise.allSettled([
        fetchGBIFData<{ results: { vernacularName: string; language: string }[] }>(`species/${taxonKey}/vernacularNames`),
        fetchGBIFData<{ results: { description: string; language: string; type: string }[] }>(`species/${taxonKey}/descriptions`)
      ])

      const speciesData: GBIFSpecies = {
        ...data,
        vernacularNames: vernacularData.status === 'fulfilled' ? vernacularData.value.results.map(result => ({
          vernacularName: result.vernacularName,
          language: result.language
        })) : [],
        descriptions: descriptionsData.status === 'fulfilled' ? descriptionsData.value.results.map(result => ({
          description: result.description,
          language: result.language,
          type: result.type
        })) : []
      }

      speciesDetailsCache.set(taxonKey, speciesData)
      return speciesData
    }
    return null
  } catch (error) {
    console.error(`Error fetching species details for taxonKey ${taxonKey}:`, error)
    return null
  }
}

/**
 * Get the taxon key for a given species name with caching
 */
export async function fetchTaxonKey(speciesName: string): Promise<number | null> {
  // Check common taxa first
  if (speciesName in COMMON_TAXA) {
    return COMMON_TAXA[speciesName as keyof typeof COMMON_TAXA].usageKey
  }

  // Check cache
  const cachedKey = gbifCache.getTaxonKey(speciesName)
  if (cachedKey !== undefined) {
    return cachedKey
  }

  try {
    // Try exact match first
    const match = await fetchGBIFData<GBIFSpeciesMatch>('species/match', { name: speciesName })

    if (match && match.usageKey) {
      gbifCache.setTaxonKey(speciesName, match.usageKey)
      return match.usageKey
    }

    // If no exact match, try search
    const searchResult = await fetchGBIFData<{ results: GBIFSpeciesMatch[] }>('species/search', {
      q: speciesName,
      limit: 1,
      rank: 'SPECIES'
    })

    if (searchResult.results && searchResult.results.length > 0) {
      const key = searchResult.results[0].key || searchResult.results[0].usageKey
      if (key) {
        gbifCache.setTaxonKey(speciesName, key)
        return key
      }
    }

    gbifCache.setTaxonKey(speciesName, null)
    return null
  } catch (error) {
    console.error(`Error fetching taxon key for ${speciesName}:`, error)
    return null
  }
}

/**
 * Fetch GBIF occurrences for a given taxon key with improved caching and filtering
 */
export async function fetchGBIFOccurrences(
  taxonKey: number,
  limit: number = 100,
  hasCoordinate: boolean = true,
  hasImages: boolean = true
): Promise<GBIFOccurrence[]> {
  if (!taxonKey) return []

  // Check cache
  const cachedOccurrences = gbifCache.getOccurrences(taxonKey)
  if (cachedOccurrences) {
    return cachedOccurrences
  }

  try {
    const allResults: GBIFOccurrence[] = []
    const pageSize = Math.min(limit, 100)
    const pagesToFetch = Math.ceil(limit / pageSize)

    // Fetch all pages in parallel
    const pagePromises = Array.from({ length: pagesToFetch }, (_, page) =>
      fetchGBIFData<{
        results: {
          key: string;
          scientificName: string;
          decimalLatitude: number;
          decimalLongitude: number;
          eventDate?: string;
          media?: Array<{
            type: string;
            identifier: string;
            title?: string;
          }>;
        }[]
      }>('occurrence/search', {
        taxonKey,
        limit: pageSize,
        offset: page * pageSize,
        hasCoordinate,
        hasImage: hasImages,
        hasGeospatialIssue: false,
        status: 'ACCEPTED',
        mediaType: hasImages ? 'StillImage' : undefined
      })
    )

    const pages = await Promise.all(pagePromises)

    for (const page of pages) {
      if (!page.results || page.results.length === 0) break

      const validOccurrences = page.results
        .filter(result =>
          typeof result.decimalLatitude === 'number' &&
          typeof result.decimalLongitude === 'number' &&
          (!hasImages || (Array.isArray(result.media) && result.media.length > 0))
        )
        .map(result => ({
          key: String(result.key || ''),
          scientificName: String(result.scientificName || ''),
          decimalLatitude: Number(result.decimalLatitude || 0),
          decimalLongitude: Number(result.decimalLongitude || 0),
          eventDate: result.eventDate ? String(result.eventDate) : undefined,
          media: Array.isArray(result.media) ? result.media
            .filter((m: { type?: string; identifier?: string }) =>
              m.type === 'StillImage' && typeof m.identifier === 'string'
            )
            .map((m: { type?: string; identifier?: string; title?: string }) => ({
              type: String(m.type || ''),
              identifier: String(m.identifier || ''),
              title: m.title ? String(m.title) : undefined
            })) : undefined
        }))

      allResults.push(...validOccurrences)
    }

    const finalResults = allResults.slice(0, limit)
    gbifCache.setOccurrences(taxonKey, finalResults)
    return finalResults
  } catch (error) {
    console.error(`Error fetching GBIF occurrences for taxonKey ${taxonKey}:`, error)
    return []
  }
}

/**
 * Get map tile URL for a taxon
 */
export function getGBIFMapUrl(taxonKey: number, style: 'classic' | 'purpleHeat' | 'greenHeat' = 'classic'): string {
  return `https://api.gbif.org/v2/map/occurrence/density/{z}/{x}/{y}@1x.png?taxonKey=${taxonKey}&style=${style}`
}

/**
 * Search for species with caching
 */
export async function searchSpecies(query: string, limit: number = 10): Promise<GBIFSpeciesMatch[]> {
  if (!query || query.length < 3) return []

  // Check cache
  const cachedMatches = gbifCache.getSpeciesMatches(query)
  if (cachedMatches) {
    return cachedMatches
  }

  try {
    const data = await fetchGBIFData<GBIFSpeciesMatch[]>('species/suggest', { q: query, limit })
    gbifCache.setSpeciesMatches(query, data)
    return data
  } catch (error) {
    console.error(`Error searching species for query "${query}":`, error)
    return []
  }
}

/**
 * Get related species
 */
export async function getRelatedSpecies(taxonKey: number, limit: number = 10): Promise<GBIFSpecies[]> {
  if (!taxonKey) return []

  try {
    const species = await getSpeciesDetails(taxonKey)
    if (!species) return []

    if (species.genusKey) {
      const data = await fetchGBIFData<{ results: GBIFSpecies[] }>('species/search', {
        genusKey: species.genusKey,
        limit,
        status: 'ACCEPTED',
        rank: 'SPECIES'
      })

      return data.results || []
    }

    if (species.familyKey) {
      const data = await fetchGBIFData<{ results: GBIFSpecies[] }>('species/search', {
        familyKey: species.familyKey,
        limit,
        status: 'ACCEPTED',
        rank: 'SPECIES'
      })

      return data.results || []
    }

    return []
  } catch (error) {
    console.error(`Error fetching related species for taxonKey ${taxonKey}:`, error)
    return []
  }
}

/**
 * Clear all caches - useful when reloading data
 */
export function clearGBIFCaches(): void {
  speciesMatchCache.clear()
  speciesDetailsCache.clear()
  occurrencesCache.clear()
}

// Add a bulk matching function for better performance
export async function bulkMatchSpeciesNames(names: string[]): Promise<Record<string, GBIFSpeciesMatch | null>> {
  const results: Record<string, GBIFSpeciesMatch | null> = {};
  const needToFetch: string[] = [];

  // First check cache and common species
  for (const name of names) {
    if (!name) continue;

    const normalizedName = name.trim();
    const cacheKey = normalizedName.toLowerCase();

    // Check common species first
    if (COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA]) {
      const commonData = COMMON_TAXA[normalizedName as keyof typeof COMMON_TAXA];
      results[normalizedName] = {
        usageKey: commonData.usageKey,
        scientificName: normalizedName,
        canonicalName: normalizedName,
        kingdom: commonData.kingdom,
        phylum: commonData.phylum,
        rank: "SPECIES",
        status: "ACCEPTED",
        matchType: "EXACT",
        confidence: 100,
        synonym: false,
        kingdomKey: 0,
        phylumKey: 0
      } as GBIFSpeciesMatch;

      // Also cache for future use
      speciesMatchCache.set(cacheKey, results[normalizedName]);
      continue;
    }

    // Check cache
    if (speciesMatchCache.has(cacheKey)) {
      results[normalizedName] = speciesMatchCache.get(cacheKey) || null;
      continue;
    }

    // Need to fetch this one
    needToFetch.push(normalizedName);
  }

  // Process remaining species in parallel batches
  if (needToFetch.length > 0) {
    // Process in batches of 10
    const BATCH_SIZE = 10;
    const BATCH_DELAY = 300; // ms between batches

    for (let i = 0; i < needToFetch.length; i += BATCH_SIZE) {
      const batch = needToFetch.slice(i, i + BATCH_SIZE);

      await Promise.all(
        batch.map(async (name) => {
          try {
            console.log(`Batch matching species name: ${name}`);
            const match = await matchSpeciesName(name);
            results[name] = match;
          } catch (error) {
            console.error(`Error in batch matching for ${name}:`, error);
            results[name] = null;
          }
        })
      );

      // Add delay between batches to avoid rate limits
      if (i + BATCH_SIZE < needToFetch.length) {
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }
  }

  return results;
}
