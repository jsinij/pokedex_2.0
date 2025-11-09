import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { usePokemon } from '../hooks/usePokemon';
import Display from './Display';
import Keypad from './Keypad';
import PanelInfo from './PanelInfo';
import missignoGif from '../../../assets/missigno.gif';

type Props = {
  /** Avisa al padre cuál es el Pokémon actual (para el panel de evolución externo). */
  onChangeTarget?: (t: string | number | undefined) => void;
};

const MAX_POKE_ID = 1025;
const MIN_POKE_ID = 1;

// helpers para validar input
const isIntegerStr = (v: string) => /^-?\d+$/.test(v.trim());
const inRange = (n: number) =>
  Number.isFinite(n) && n >= MIN_POKE_ID && n <= MAX_POKE_ID;

const NOT_FOUND_MSG =
  'Pokemon no encontrado por favor, consulte un nuevo Pokemon lo más rápido posible...';

// id aleatorio 1..1025
function getRandomId() {
  return Math.floor(Math.random() * MAX_POKE_ID) + 1;
}

/**
 * Pokédex “grande”: pantalla, controles, panel de info y buscador.
 * También maneja el modo “Missigno” cuando el input es inválido.
 */
export default function Pokedex({ onChangeTarget }: Props) {
  // lo que el usuario escribe
  const [input, setInput] = useState<string>('');
  // lo que realmente consultamos a la API (número o nombre)
  const [query, setQuery] = useState<string | number | null>(null);
  // recuerda si la última búsqueda fue por id o por nombre (útil para decidir Missigno)
  const [lastKind, setLastKind] = useState<'id' | 'name' | null>(null);

  // estado para forzar la UI de Missigno (nombre, sprite y texto fijos)
  const [override, setOverride] = useState<{
    active: boolean;
    name: string;
    sprite: string;
    flavor: string;
  } | null>(null);

  // hook que va a PokeAPI y nos mapea lo básico del Pokémon
  const { data, loading, error, heightM, weightKg } = usePokemon(query);

  // al montar: mostrar Chansey por defecto
  useEffect(() => {
    setInput('chansey');
    setQuery('chansey');
    setLastKind('name');
  }, []);

  // si la última búsqueda fue por nombre y hubo error => mostramos Missigno
  useEffect(() => {
    if (lastKind === 'name' && error) triggerMissigno();
  }, [error, lastKind]);

  // cada vez que cambia el Pokémon válido, avisamos al padre (para el panel de evolución)
  useEffect(() => {
    if (override?.active)
      onChangeTarget?.(undefined); // en Missigno no mover el panel
    else onChangeTarget?.(data?.name ?? data?.id);
  }, [data?.id, data?.name, override?.active, onChangeTarget]);

  // quita el modo Missigno
  const clearOverride = () => setOverride(null);

  // activa el modo Missigno y detiene requests
  const triggerMissigno = () => {
    setOverride({
      active: true,
      name: 'Missigno',
      sprite: missignoGif,
      flavor: NOT_FOUND_MSG,
    });
    setQuery(null); // evita llamadas innecesarias
  };

  // agrega dígito al input (máx 4 chars para id)
  const onDigit = (d: number) => setInput((prev) => (prev + d).slice(0, 4));

  // limpia todo
  const onClear = useCallback(() => {
    setInput('');
    setLastKind(null);
    clearOverride();
  }, []);

  // procesa el submit del buscador (Enter / OK / botón A)
  const onSubmit = useCallback(() => {
    const raw = input.trim();
    if (!raw) return;

    // si es número…
    if (isIntegerStr(raw)) {
      const n = parseInt(raw, 10);
      setLastKind('id');
      if (!inRange(n)) {
        // fuera del rango => Missigno
        triggerMissigno();
        return;
      }
      clearOverride();
      setQuery(n);
      return;
    }

    // si es texto (nombre)…
    setLastKind('name');
    clearOverride();
    setQuery(raw.toLowerCase());
  }, [input]);

  // botón random / flecha arriba
  const onRandom = useCallback(() => {
    clearOverride();
    setLastKind('id');
    const id = getRandomId();
    setInput(String(id));
    setQuery(id);
  }, []);

  // flechas izquierda/derecha para +/- 1 (solo cuando el input actual es numérico)
  const stepId = useCallback(
    (delta: number) => {
      if (!isIntegerStr(input)) return;
      const next = parseInt(input, 10) + delta;
      setLastKind('id');
      if (!inRange(next)) {
        triggerMissigno();
        setInput(String(next)); // mostramos el valor fuera de rango en el input
        return;
      }
      clearOverride();
      setInput(String(next));
      setQuery(next);
    },
    [input]
  );

  // placeholder estático (memo por prolijidad)
  const placeholder = useMemo(() => 'Name or ID', []);

  // datos que pintamos (si hay Missigno activo, tiene prioridad)
  const renderName = override?.active ? override.name : data?.name;
  const renderSprite = override?.active
    ? override.sprite
    : data?.sprite ?? null;
  const renderFlavor = override?.active ? override.flavor : data?.flavorText;
  const renderHeight = override?.active ? null : heightM; // Missigno => “???”
  const renderWeight = override?.active ? null : weightKg;
  const renderError = override?.active ? null : error ?? null;

  return (
    <div className="pokedex">
      {/* Columna izquierda: cabecera + pantalla + controles */}
      <div className="pokedex-left">
        {/* cabecera estilo “gameboy” */}
        <div className="gameboy-header">
          <div className="power-circle" />
          <div className="indicator-lights">
            <div className="light red" />
            <div className="light yellow" />
            <div className="light green" />
          </div>
        </div>

        <div className="divider" />

        {/* pantalla central con sprite y fondo */}
        <div className="screen-container">
          <Display
            id={override?.active ? undefined : data?.id}
            name={renderName ?? undefined}
            sprite={renderSprite}
            loading={loading}
            variant={override?.active ? 'missigno' : 'default'}
          />

          {/* dos botones decorativos bajo la pantalla */}
          <div className="screen-buttons">
            <button className="screen-btn" aria-label="screen button 1" />
            <button className="screen-btn" aria-label="screen button 2" />
          </div>

          {/* “parlante” decorativo */}
          <div className="speaker">
            <div className="speaker-line" />
            <div className="speaker-line" />
            <div className="speaker-line" />
            <div className="speaker-line" />
          </div>
        </div>

        {/* controles: d-pad y botones A/B */}
        <div className="controls">
          <div className="dpad">
            <button
              className="dpad-btn dpad-up"
              aria-label="up"
              onClick={onRandom}
              disabled={loading}
            />
            <button
              className="dpad-btn dpad-down"
              aria-label="down"
              onClick={onClear}
              disabled={loading}
            />
            <button
              className="dpad-btn dpad-left"
              aria-label="left"
              onClick={() => stepId(-1)}
              disabled={loading}
            />
            <button
              className="dpad-btn dpad-right"
              aria-label="right"
              onClick={() => stepId(+1)}
              disabled={loading}
            />
            <div className="dpad-center" />
          </div>

          <div className="action-buttons">
            <button
              className="action-btn btn-b"
              onClick={onClear}
              disabled={loading}
              title="Clear (B)"
            >
              B
            </button>
            <button
              className="action-btn btn-a"
              onClick={onSubmit}
              disabled={loading || !input.trim()}
              title="Search (A)"
            >
              A
            </button>
          </div>
        </div>
      </div>

      {/* Columna derecha: panel de info + buscador + keypad
          (el panel de evolución NO va aquí, está afuera en <App />) */}
      <div className="pokedex-right">
        <div className="info-section">
          <PanelInfo
            name={renderName ?? undefined}
            types={override?.active ? [] : data?.types}
            heightM={renderHeight}
            weightKg={renderWeight}
            flavor={renderFlavor}
            error={renderError}
          />
        </div>

        {/* buscador por nombre o id */}
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault();
            onSubmit();
          }}
        >
          <input
            className="search-input"
            value={input}
            onChange={(e) => {
              const v = e.target.value;
              // si es solo dígitos y signo, recortamos a 5 chars, si no, dejamos tal cual
              if (/^-?\d*$/.test(v)) setInput(v.slice(0, 5));
              else setInput(v);
              // si estaba Missigno activo, lo desactivamos al escribir
              if (override?.active) clearOverride();
            }}
            placeholder={placeholder}
            aria-label="pokemon input"
            disabled={loading}
          />
          <button
            className="ok-btn"
            type="submit"
            disabled={loading || !input.trim()}
          >
            OK
          </button>
          <button
            className="random-btn"
            type="button"
            onClick={onRandom}
            disabled={loading}
          >
            RND
          </button>
        </form>

        {/* keypad numérico para escribir ids rápido */}
        <Keypad onDigit={onDigit} onClear={onClear} onSearch={onSubmit} />
      </div>
    </div>
  );
}
