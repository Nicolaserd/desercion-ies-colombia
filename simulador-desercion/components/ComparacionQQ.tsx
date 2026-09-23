"use client";

import { useMemo } from "react";
import { AJUSTES } from "@/lib/ajustes";
import { porcentaje } from "@/lib/escala";
import type { Panel } from "@/lib/simular";

const ANCHO = 520;
const ALTO = 380;
const A = 52;
const B = 40;
const T = 14;
const R = 16;

/**
 * Cuantil a cuantil: la pregunta que sí se puede contestar con estos datos.
 * ¿La simulación reproduce la distribución real, tramo por tramo?
 */
export default function ComparacionQQ({ panel }: { panel: Panel }) {
  const ultimo = panel.anios[panel.anios.length - 1];
  const real = AJUSTES.anios[String(ultimo)]?.valores;

  const puntos = useMemo(() => {
    if (!real) return [];
    const sim = panel.matriz.map((f) => f[f.length - 1]).sort((a, b) => a - b);
    const rr = [...real].sort((a, b) => a - b);
    const cuantil = (o: number[], p: number) => {
      const h = (o.length - 1) * p;
      const lo = Math.floor(h);
      const hi = Math.ceil(h);
      return o[lo] + (o[hi] - o[lo]) * (h - lo);
    };
    const salida: [number, number][] = [];
    for (let k = 1; k < 100; k++) {
      salida.push([cuantil(rr, k / 100), cuantil(sim, k / 100)]);
    }
    return salida;
  }, [panel, real]);

  if (!real) {
    return (
      <p className="aviso">
        {ultimo} es un año proyectado: no hay dato real de SPADIES con el que
        compararlo. Reduzca el número de años para volver al rango 2010–2024.
      </p>
    );
  }

  const tope = Math.max(
    0.05,
    ...puntos.map((p) => Math.max(p[0], p[1])),
  ) * 1.08;
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const X = (v: number) => r2(A + (v / tope) * (ANCHO - A - R));
  const Y = (v: number) => r2(T + (1 - v / tope) * (ALTO - T - B));

  const marcas = [0, 0.25, 0.5, 0.75, 1].map((f) => f * tope);

  return (
    <>
      <div className="lienzo-svg">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Cuantiles simulados frente a reales">
          {marcas.map((m, i) => (
            <g key={i}>
              <line x1={A} x2={ANCHO - R} y1={Y(m)} y2={Y(m)} className="rejilla" />
              <line y1={T} y2={ALTO - B} x1={X(m)} x2={X(m)} className="rejilla" />
              <text x={A - 8} y={Y(m)} className="marca fin">
                {porcentaje(m, 0)}
              </text>
              <text x={X(m)} y={ALTO - B + 17} className="marca medio">
                {porcentaje(m, 0)}
              </text>
            </g>
          ))}

          <line
            x1={X(0)}
            y1={Y(0)}
            x2={X(tope)}
            y2={Y(tope)}
            className="linea-identidad"
          />

          {puntos.map((p, i) => (
            <circle key={i} cx={X(p[0])} cy={Y(p[1])} r={3} className="punto-sim" />
          ))}

          <text className="rotulo" transform={`translate(14 ${ALTO / 2}) rotate(-90)`}>
            Cuantil simulado
          </text>
          <text className="rotulo medio" x={(ANCHO + A) / 2} y={ALTO - 6}>
            Cuantil real {ultimo}
          </text>
        </svg>
      </div>
      <div className="leyenda">
        <span className="leyenda-item">
          <i className="punto" style={{ background: "#4fb3e8" }} />
          Percentiles 1 a 99
        </span>
        <span className="leyenda-item">
          <i className="raya identidad" />
          Coincidencia perfecta
        </span>
      </div>
    </>
  );
}
