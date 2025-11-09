import { useEffect, useMemo, useRef, useState } from 'react';
import { getPokemonBasic, getSpecies } from '../api/pokemonApi';
import type { PokemonBasic } from '../types/pokemon';

/** Cache sencilla en memoria para no repetir llamadas de la misma búsqueda. */
const cache = new Map<string | number, PokemonBasic>();

/**
 * Dado un nombre o id, trae info base + flavor text de species.
 * Devuelve también altura/peso ya convertidos a m y kg.
 */
export function usePokemon(query: string | number | null) {
  const [data, setData] = useState<PokemonBasic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!query && query !== 0) return;
    const key = typeof query === 'string' ? query.toLowerCase() : query;

    // cache hit
    if (cache.has(key)) {
      setData(cache.get(key)!);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    (async () => {
      try {
        const p = await getPokemonBasic(key, ctrl.signal);
        const species = await getSpecies(p.id, ctrl.signal);

        // usamos la entrada en inglés (la más consistente)
        const enEntry = species.flavor_text_entries.find(
          (e: any) => e.language?.name === 'en'
        );
        const flavor = enEntry?.flavor_text?.replace(/\f|\n|\r/g, ' ') ?? '';

        const mapped: PokemonBasic = {
          id: p.id,
          name: p.name,
          sprite:
            p.sprites?.other?.['official-artwork']?.front_default ??
            p.sprites?.front_default ??
            null,
          types: (p.types ?? []).map((t: any) => t.type.name),
          height: p.height, // decímetros
          weight: p.weight, // hectogramos
          flavorText: flavor,
        };

        cache.set(key, mapped);
        setData(mapped);
      } catch (e: any) {
        setError(e?.message ?? 'Error al obtener datos');
        setData(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [query]);

  // conversiones “amigables”
  const kg = useMemo(() => (data ? data.weight / 10 : null), [data]);
  const m = useMemo(() => (data ? data.height / 10 : null), [data]);

  return { data, loading, error, heightM: m, weightKg: kg };
}
