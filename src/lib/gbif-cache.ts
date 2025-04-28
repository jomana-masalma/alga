import { GBIFOccurrence, GBIFSpecies, GBIFSpeciesMatch } from '@/types/gbif-types';

interface GBIFCacheData {
  taxonKeys: { [speciesName: string]: number | null };
  occurrences: { [taxonKey: number]: GBIFOccurrence[] };
  speciesDetails: { [taxonKey: number]: GBIFSpecies };
  speciesMatches: { [query: string]: GBIFSpeciesMatch[] };
}

const CACHE_KEY = 'gbif_cache_v1';

class GBIFCache {
  private cache: GBIFCacheData;

  constructor() {
    this.cache = this.loadFromStorage();

    // Add beforeunload event listener for cache cleanup
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.saveToStorage();
      });
    }
  }

  private loadFromStorage(): GBIFCacheData {
    try {
      const storedCache = localStorage.getItem(CACHE_KEY);
      if (storedCache) {
        return JSON.parse(storedCache);
      }
    } catch (error) {
      console.warn('Failed to load GBIF cache from storage:', error);
    }
    return {
      taxonKeys: {},
      occurrences: {},
      speciesDetails: {},
      speciesMatches: {},
    };
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('Failed to save GBIF cache to storage:', error);
    }
  }

  getTaxonKey(speciesName: string): number | null | undefined {
    return this.cache.taxonKeys[speciesName];
  }

  setTaxonKey(speciesName: string, taxonKey: number | null): void {
    this.cache.taxonKeys[speciesName] = taxonKey;
    this.saveToStorage();
  }

  getOccurrences(taxonKey: number): GBIFOccurrence[] | undefined {
    return this.cache.occurrences[taxonKey];
  }

  setOccurrences(taxonKey: number, occurrences: GBIFOccurrence[]): void {
    this.cache.occurrences[taxonKey] = occurrences;
    this.saveToStorage();
  }

  getSpeciesDetails(taxonKey: number): GBIFSpecies | undefined {
    return this.cache.speciesDetails[taxonKey];
  }

  setSpeciesDetails(taxonKey: number, details: GBIFSpecies): void {
    this.cache.speciesDetails[taxonKey] = details;
    this.saveToStorage();
  }

  getSpeciesMatches(query: string): GBIFSpeciesMatch[] | undefined {
    return this.cache.speciesMatches[query];
  }

  setSpeciesMatches(query: string, matches: GBIFSpeciesMatch[]): void {
    this.cache.speciesMatches[query] = matches;
    this.saveToStorage();
  }

  clearCache(): void {
    this.cache = {
      taxonKeys: {},
      occurrences: {},
      speciesDetails: {},
      speciesMatches: {},
    };
    localStorage.removeItem(CACHE_KEY);
  }
}

export const gbifCache = new GBIFCache();