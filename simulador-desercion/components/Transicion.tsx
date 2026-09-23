"use client";

import { useMemo } from "react";
import { AJUSTES } from "@/lib/ajustes";
import { transicionQuintiles, type Panel } from "@/lib/simular";

const ETQ = ["Q1", "Q2", "Q3", "Q4", "Q5"];

/**
 * Matriz de transición entre quintiles. Es lo único que sobrevivió del modelo
 * markoviano: la matriz resultó estable en el tiempo (p = 0,78), aunque la
 * propiedad de Markov en sí quedó rechazada (orden 2 vs 1, p ≈ 1e-75). Sirve
 * como descripción de la movilidad, no como mecanismo generador.
 */
export default function Transicion({ panel }: { panel: Panel }) {
  const sim = useMemo(() => transicionQuintiles(panel.matriz), [panel]);
  const real = AJUSTES.dependencia.transicion;

  if (sim.length === 0) {
    return (
      <p className="aviso">
        Se necesitan al menos 5 instituciones y 2 años para estimar transiciones.
      </p>
    );
  }

  return (
    <>
      <div className="transicion">
        <div className="tr-esquina">t → t+1</div>
        {ETQ.map((e) => (
          <div key={`c${e}`} className="tr-cabecera">
            {e}
          </div>
        ))}
        {sim.map((fila, i) => (
          <Fila key={i} i={i} fila={fila} real={real[i]} />
        ))}
      </div>
      <p className="tr-pie">
        Cifra grande: simulado. Debajo: los datos reales de SPADIES. La diagonal
        es la probabilidad de seguir en el mismo quintil al año siguiente.
      </p>
    </>
  );
}

function Fila({ i, fila, real }: { i: number; fila: number[]; real: number[] }) {
  return (
    <>
      <div className="tr-cabecera fila">{ETQ[i]}</div>
      {fila.map((v, j) => (
        <div
          key={j}
          className={`tr-celda${i === j ? " diagonal" : ""}`}
          style={{ background: `rgba(42, 120, 214, ${Math.min(0.92, v * 1.15)})` }}
          title={`${ETQ[i]} → ${ETQ[j]}: simulado ${(v * 100).toFixed(1)}%, real ${(real[j] * 100).toFixed(1)}%`}
        >
          <b>{(v * 100).toFixed(0)}</b>
          <i>{(real[j] * 100).toFixed(0)}</i>
        </div>
      ))}
    </>
  );
}
