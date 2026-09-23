"use client";

import { AJUSTES } from "@/lib/ajustes";
import type { Familia } from "@/lib/distribuciones";

export interface Estado {
  nIes: number;
  nAnios: number;
  semilla: string;
  familia: Familia;
  /** λ — nivel permanente de la institución. */
  icc: number;
  /** ρ — persistencia del componente transitorio. */
  rho: number;
  truncar: boolean;
  ordenar: boolean;
}

interface Props {
  estado: Estado;
  cambiar: <K extends keyof Estado>(clave: K, valor: Estado[K]) => void;
  alAzar: () => void;
  reiniciar: () => void;
}

export default function BarraControles({
  estado,
  cambiar,
  alAzar,
  reiniciar,
}: Props) {
  return (
    <div className="barra">
      <div className="control deslizador">
        <label htmlFor="n-ies">
          Instituciones <b>{estado.nIes}</b>
        </label>
        <input
          id="n-ies"
          type="range"
          min={20}
          max={600}
          step={1}
          value={estado.nIes}
          onChange={(e) => cambiar("nIes", Number(e.target.value))}
        />
      </div>

      <div className="control deslizador">
        <label htmlFor="n-anios">
          Años <b>{estado.nAnios}</b>
        </label>
        <input
          id="n-anios"
          type="range"
          min={2}
          max={25}
          step={1}
          value={estado.nAnios}
          onChange={(e) => cambiar("nAnios", Number(e.target.value))}
        />
      </div>

      <div className="control">
        <label htmlFor="familia">Distribución</label>
        <select
          id="familia"
          value={estado.familia}
          onChange={(e) => cambiar("familia", e.target.value as Familia)}
        >
          {AJUSTES.familias.map((f) => (
            <option key={f.clave} value={f.clave}>
              {f.nombre}
              {f.estado === "rechazada" ? " — rechazada" : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="control">
        <label htmlFor="icc">
          Permanente λ <b>{estado.icc.toFixed(2)}</b>
        </label>
        <input
          id="icc"
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={estado.icc}
          onChange={(e) => cambiar("icc", Number(e.target.value))}
        />
      </div>

      <div className="control">
        <label htmlFor="rho">
          Transitorio ρ <b>{estado.rho.toFixed(2)}</b>
        </label>
        <input
          id="rho"
          type="range"
          min={0}
          max={0.95}
          step={0.01}
          value={estado.rho}
          onChange={(e) => cambiar("rho", Number(e.target.value))}
        />
      </div>

      <div className="control ancho">
        <label htmlFor="semilla">Semilla</label>
        <input
          id="semilla"
          type="text"
          spellCheck={false}
          value={estado.semilla}
          onChange={(e) => cambiar("semilla", e.target.value)}
        />
      </div>

      <div className="control botones">
        <button type="button" className="primario" onClick={alAzar}>
          Semilla al azar
        </button>
        <button type="button" onClick={reiniciar}>
          Reiniciar
        </button>
      </div>

      <div className="control casillas">
        <label className="casilla">
          <input
            type="checkbox"
            checked={estado.truncar}
            onChange={(e) => cambiar("truncar", e.target.checked)}
          />
          Truncar en 100%
        </label>
        <label className="casilla">
          <input
            type="checkbox"
            checked={estado.ordenar}
            onChange={(e) => cambiar("ordenar", e.target.checked)}
          />
          Ordenar IES
        </label>
      </div>
    </div>
  );
}
