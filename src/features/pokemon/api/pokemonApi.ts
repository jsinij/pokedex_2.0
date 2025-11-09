const BASE = 'https://pokeapi.co/api/v2';

async function http<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json() as Promise<T>;
}

export async function getSpecies(
  nameOrId: string | number,
  signal?: AbortSignal
) {
  return http<any>(
    `/pokemon-species/${String(nameOrId).toLowerCase()}`,
    signal
  );
}

export async function getPokemonBasic(
  nameOrId: string | number,
  signal?: AbortSignal
) {
  return http<any>(`/pokemon/${String(nameOrId).toLowerCase()}`, signal);
}

/** Lista nombres (y urls) de pokémon para paginar el “álbum”. */
export async function listPokemon(
  offset: number,
  limit: number,
  signal?: AbortSignal
) {
  const data = await http<any>(
    `/pokemon?offset=${offset}&limit=${limit}`,
    signal
  );
  // nos quedamos solo con name (más ligero para el hook)
  return (data?.results ?? []).map((r: any) => ({ name: r.name }));
}
