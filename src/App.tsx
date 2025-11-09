import React, { useState } from 'react';
import Pokedex from './features/pokemon/components/Pokedex';
import EvolutionChain from './features/pokemon/components/EvolutionChain';
import Album from './features/pokemon/components/Album';

/**
 * Orquesta la pokédex grande + el panel de evolución a la derecha.
 * Mantiene el “evoTarget” que recibe desde <Pokedex /> y se lo pasa a <EvolutionChain />.
 */

type ViewMode = 'pokedex' | 'album';

export default function App() {
  const [evoTarget, setEvoTarget] = useState<string | number | undefined>(
    'chansey'
  );
  const [view, setView] = useState<ViewMode>('pokedex');

  const toggleView = () =>
    setView((v) => (v === 'pokedex' ? 'album' : 'pokedex'));

  return (
    <div className="layout">
      {/* Botón fijo arriba/izquierda, fuera del componente pokedex */}
      <button className="view-toggle" onClick={toggleView}>
        {view === 'pokedex' ? 'Álbum' : 'Pokédex'}
      </button>

      {view === 'pokedex' ? (
        <div className="pokedex-container">
          {/* Pokédex grande */}
          <Pokedex onChangeTarget={setEvoTarget} />

          {/* Pokédex pequeña (panel a la derecha) */}
          <aside className="evolution-panel">
            <EvolutionChain target={evoTarget} />
          </aside>
        </div>
      ) : (
        <Album />
      )}
    </div>
  );
}
