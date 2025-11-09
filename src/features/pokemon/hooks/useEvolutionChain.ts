import { useEffect, useRef, useState } from 'react';
import { getSpecies, getPokemonBasic } from '../api/pokemonApi';

export type EvoDetail = {
  trigger?: string;
  min_level?: number | null;
  item?: string | null;
  held_item?: string | null;
  time_of_day?: string | null;
  known_move?: string | null;
  happiness?: number | null;
  other?: string | null;
};

export type EvoStage = {
  name: string;
  sprite: string | null;
  detailsFromPrev?: EvoDetail | null;
  children: EvoStage[];
};

/** Convierte el objeto de condiciones de la API en algo más legible. */
function mapDetails(raw: any): EvoDetail {
  if (!raw) return {};
  return {
    trigger: raw.trigger?.name ?? undefined,
    min_level: raw.min_level ?? null,
    item: raw.item?.name ?? null,
    held_item: raw.held_item?.name ?? null,
    time_of_day: raw.time_of_day || null,
    known_move: raw.known_move?.name ?? null,
    happiness: raw.min_happiness ?? null,
    other:
      [
        raw.location?.name,
        raw.gender != null ? `gender:${raw.gender}` : null,
        raw.needs_overworld_rain ? 'rain' : null,
        raw.turn_upside_down ? 'upside-down' : null,
        raw.min_beauty != null ? `beauty:${raw.min_beauty}` : null,
      ]
        .filter(Boolean)
        .join(', ') || null,
  };
}

/** Pide el artwork principal para cada especie de la cadena. */
async function enrichWithSprite(name: string, signal?: AbortSignal) {
  try {
    const p = await getPokemonBasic(name, signal);
    const sprite =
      p.sprites?.other?.['official-artwork']?.front_default ??
      p.sprites?.front_default ??
      null;
    return sprite as string | null;
  } catch {
    return null;
  }
}

/** Construye el árbol de evolución recursivamente. */
async function buildStage(node: any, signal?: AbortSignal): Promise<EvoStage> {
  const name: string = node?.species?.name;
  const sprite = await enrichWithSprite(name, signal);

  const branches = Array.isArray(node?.evolves_to) ? node.evolves_to : [];
  const children: EvoStage[] = await Promise.all(
    branches.map(async (b: any) => {
      const details =
        Array.isArray(b.evolution_details) && b.evolution_details[0]
          ? mapDetails(b.evolution_details[0])
          : null;
      const child = await buildStage(b, signal);
      child.detailsFromPrev = details;
      return child;
    })
  );

  return { name, sprite, detailsFromPrev: null, children };
}

/**
 * Hook que, dado un nombre o id, trae la cadena evolutiva completa (con sprites).
 * Maneja aborts para evitar “fugas” al cambiar rápido de Pokémon.
 */
export function useEvolutionChain(
  nameOrId: string | number | undefined | null
) {
  const [data, setData] = useState<EvoStage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ctrlRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!nameOrId) {
      setData(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    ctrlRef.current?.abort();
    const ctrl = new AbortController();
    ctrlRef.current = ctrl;

    (async () => {
      try {
        const species = await getSpecies(nameOrId, ctrl.signal);
        const chainUrl: string | undefined = species?.evolution_chain?.url;
        if (!chainUrl) throw new Error('No evolution chain');

        const chain = await fetch(chainUrl, { signal: ctrl.signal }).then(
          (r) => {
            if (!r.ok) throw new Error(`HTTP ${r.status}`);
            return r.json();
          }
        );

        const root = await buildStage(chain.chain, ctrl.signal);
        setData(root);
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setError(e?.message ?? 'Error fetching evolution chain');
        setData(null);
      } finally {
        setLoading(false);
      }
    })();

    return () => ctrl.abort();
  }, [nameOrId]);

  return { data, loading, error };
}
