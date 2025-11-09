import React, { useMemo, useState } from 'react';
import { useAlbumPage } from '../hooks/useAlbumPage';
import TypeBadge from './TypeBadge';

// Total de pokémon en la Pokédex (lo usamos para paginar)
const TOTAL = 1025;
// Queremos 5x3 cartas por página
const PAGE_SIZE = 15;
// Número total de páginas calculado a partir del total
const TOTAL_PAGES = Math.ceil(TOTAL / PAGE_SIZE);

export default function Album() {
  // Página actual (empezamos en 1 para que sea más “humano”)
  const [page, setPage] = useState(1);
  // Offset para pedir los datos del backend/Hook (0, 15, 30, …)
  const offset = (page - 1) * PAGE_SIZE;

  // Traemos la “página” actual del álbum: nombres, tipos y sprite
  const { items, loading, error } = useAlbumPage(offset, PAGE_SIZE);

  // Habilitamos/deshabilitamos flechas según la página
  const canPrev = page > 1;
  const canNext = page < TOTAL_PAGES;

  // Navegación simple: si puedo, voy una página atrás/adelante
  const prev = () => canPrev && setPage((p) => p - 1);
  const next = () => canNext && setPage((p) => p + 1);

  // Si la última página viene incompleta, rellenamos con “huecos”
  // para que la grilla siempre se vea 5x3
  const paddedItems = useMemo(() => {
    const arr = items ?? [];
    const extra = PAGE_SIZE - arr.length;
    return extra > 0
      ? [...arr, ...Array.from({ length: extra }, () => null)]
      : arr;
  }, [items]);

  return (
    <div className="album-container">
      {/* Cabecera del álbum: título y flechas de navegación */}
      <div className="album-header">
        <button
          className="album-arrow"
          onClick={prev}
          disabled={!canPrev}
          aria-label="Página anterior"
        >
          ◀
        </button>
        <div className="album-title">Álbum Pokédex</div>
        <button
          className="album-arrow"
          onClick={next}
          disabled={!canNext}
          aria-label="Página siguiente"
        >
          ▶
        </button>
      </div>

      {/* Indicador de página actual */}
      <div className="album-subtitle">
        Página {page} / {TOTAL_PAGES}
      </div>

      {/* Grilla 5x3: estados de carga/error y render de cartas */}
      <div className="album-grid">
        {loading && <div className="album-loading">Cargando…</div>}
        {error && <div className="album-error">⚠ {error}</div>}

        {!loading &&
          !error &&
          paddedItems.map((it, idx) =>
            it ? (
              // Carta de pokémon con sprite, nombre y chips de tipos
              <div className="album-card" key={it.name}>
                {it.sprite ? (
                  <img className="album-sprite" src={it.sprite} alt={it.name} />
                ) : (
                  // Si no hay sprite, mostramos un bloque placeholder
                  <div className="album-sprite placeholder" />
                )}
                <div className="album-name">{it.name}</div>
                <div className="album-types">
                  {it.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>
              </div>
            ) : (
              // “Hueco” visual para completar la grilla en la última página
              <div className="album-card empty" key={`empty-${idx}`} />
            )
          )}
      </div>
    </div>
  );
}
