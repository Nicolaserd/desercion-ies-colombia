"use client";

import { AJUSTES } from "@/lib/ajustes";
import { numero } from "@/lib/escala";

const ANCHO = 520;
const ALTO = 250;
const A = 46;
const B = 34;
const T = 12;
const R = 12;

interface Props {
  acf: number[];
}

/**
 * La autocorrelación por rezago es la medida que separó los modelos: una cadena
 * de Markov obliga a que r(h) = r(1)^h, y los datos no hacen eso.
 */
export default function Memoria({ acf }: Props) {
  const rezagos = [1, 2, 3, 4, 5];
  const real = rezagos.map((h) => AJUSTES.dependencia.acfReal[String(h)] ?? NaN);
  const sim = rezagos.map((h) => acf[h - 1] ?? NaN);
  const markov = rezagos.map((h) => Math.pow(real[0], h));

  const X = (h: number) => A + ((h - 1) / (rezagos.length - 1)) * (ANCHO - A - R);
  const Y = (v: number) => T + (1 - v / 0.85) * (ALTO - T - B);
  const r2 = (v: number) => Math.round(v * 100) / 100;

  const ruta = (vs: number[]) =>
    vs
      .map((v, i) => (Number.isFinite(v) ? `${i === 0 ? "M" : "L"}${r2(X(i + 1))},${r2(Y(v))}` : ""))
      .filter(Boolean)
      .join(" ");

  return (
    <>
      <div className="lienzo-svg">
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} role="img" aria-label="Memoria por rezago">
          {[0, 0.2, 0.4, 0.6, 0.8].map((v) => (
            <g key={v}>
              <line x1={A} x2={ANCHO - R} y1={r2(Y(v))} y2={r2(Y(v))} className="rejilla" />
              <text x={A - 9} y={r2(Y(v))} className="marca fin">
                {numero(v, 1)}
              </text>
            </g>
          ))}
          {rezagos.map((h) => (
            <text key={h} x={r2(X(h))} y={ALTO - B + 16} className="marca medio">
              {h}
            </text>
          ))}
          <text className="rotulo medio" x={(ANCHO + A) / 2} y={ALTO - 6}>
            Rezago en años
          </text>

          <path d={ruta(markov)} className="linea-markov" />
          <path d={ruta(real)} className="linea-real" />
          <path d={ruta(sim)} className="linea-sim" />
          {real.map((v, i) => (
            <circle key={`r${i}`} cx={r2(X(i + 1))} cy={r2(Y(v))} r={4} className="punto-real" />
          ))}
          {sim.map((v, i) =>
            Number.isFinite(v) ? (
              <circle key={`s${i}`} cx={r2(X(i + 1))} cy={r2(Y(v))} r={4} className="punto-sim" />
            ) : null,
          )}
        </svg>
      </div>
      <div className="leyenda">
        <span className="leyenda-item">
          <i className="punto" style={{ background: "#eb6834" }} />
          Real SPADIES
        </span>
        <span className="leyenda-item">
          <i className="punto" style={{ background: "#4fb3e8" }} />
          Simulado
        </span>
        <span className="leyenda-item">
          <i className="raya" />
          Lo que exigiría Markov: r(1)^h
        </span>
      </div>
    </>
  );
}
