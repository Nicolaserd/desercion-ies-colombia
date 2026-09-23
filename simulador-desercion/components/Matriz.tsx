"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { colorDe, porcentaje } from "@/lib/escala";
import type { Panel } from "@/lib/simular";

interface Props {
  panel: Panel;
  ordenar: boolean;
}

interface Celda {
  ies: number;
  anio: number;
  tasa: number;
  x: number;
  y: number;
}

export default function Matriz({ panel, ordenar }: Props) {
  const lienzo = useRef<HTMLCanvasElement>(null);
  const caja = useRef<HTMLDivElement>(null);
  const [encima, setEncima] = useState<Celda | null>(null);
  const geometria = useRef({ x0: 0, y0: 0, ancho: 0, alto: 0, filas: 1, cols: 1 });

  // Memoizado: si cambiara de identidad en cada render, el canvas se
  // redibujaría entero con cada movimiento del ratón.
  const orden = useMemo(
    () =>
      ordenar
        ? panel.matriz
            .map((f, i) => ({ i, m: f.reduce((a, b) => a + b, 0) / f.length }))
            .sort((a, b) => b.m - a.m)
            .map((o) => o.i)
        : panel.matriz.map((_, i) => i),
    [panel, ordenar],
  );

  useEffect(() => {
    const cv = lienzo.current;
    const cont = caja.current;
    if (!cv || !cont) return;

    const dibujar = () => {
      const dpr = window.devicePixelRatio || 1;
      const anchoCss = Math.max(240, cont.clientWidth);
      const filas = panel.matriz.length;
      const cols = panel.anios.length;

      const margenIzq = 46;
      const margenAbajo = 26;
      const util = anchoCss - margenIzq - 6;
      const anchoCelda = util / cols;
      // Celdas legibles sin que la matriz se vuelva un muro de 2000px.
      const altoCelda = Math.max(1.4, Math.min(anchoCelda, 560 / filas));
      const altoCss = Math.round(filas * altoCelda + margenAbajo + 6);

      cv.style.width = "100%";
      cv.style.height = `${altoCss}px`;
      cv.width = Math.round(anchoCss * dpr);
      cv.height = Math.round(altoCss * dpr);

      const g = cv.getContext("2d");
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, anchoCss, altoCss);

      geometria.current = {
        x0: margenIzq,
        y0: 4,
        ancho: anchoCelda,
        alto: altoCelda,
        filas,
        cols,
      };

      for (let r = 0; r < filas; r++) {
        const fila = panel.matriz[orden[r]];
        for (let c = 0; c < cols; c++) {
          g.fillStyle = colorDe(fila[c]);
          g.fillRect(
            margenIzq + c * anchoCelda,
            4 + r * altoCelda,
            Math.max(1, anchoCelda - (anchoCelda > 6 ? 1 : 0)),
            Math.max(1, altoCelda - (altoCelda > 6 ? 1 : 0)),
          );
        }
      }

      // Ejes
      g.font =
        '11px var(--mono, ui-monospace), ui-monospace, SFMono-Regular, monospace';
      g.fillStyle = "#8b9bb4";
      g.textBaseline = "top";
      g.textAlign = "center";
      const paso = Math.ceil(cols / 8);
      for (let c = 0; c < cols; c += paso) {
        g.fillText(
          String(panel.anios[c]),
          margenIzq + (c + 0.5) * anchoCelda,
          4 + filas * altoCelda + 7,
        );
      }
      g.textAlign = "right";
      g.textBaseline = "middle";
      g.fillText("IES 1", margenIzq - 8, 4 + altoCelda / 2);
      g.fillText(`IES ${filas}`, margenIzq - 8, 4 + filas * altoCelda - altoCelda / 2);
    };

    dibujar();
    const ro = new ResizeObserver(dibujar);
    ro.observe(cont);
    return () => ro.disconnect();
  }, [panel, orden]);

  const mover = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cv = lienzo.current;
    if (!cv) return;
    const caja2 = cv.getBoundingClientRect();
    const px = e.clientX - caja2.left;
    const py = e.clientY - caja2.top;
    const { x0, y0, ancho, alto, filas, cols } = geometria.current;
    const c = Math.floor((px - x0) / ancho);
    const r = Math.floor((py - y0) / alto);
    if (c < 0 || c >= cols || r < 0 || r >= filas) {
      setEncima(null);
      return;
    }
    setEncima({
      ies: orden[r] + 1,
      anio: panel.anios[c],
      tasa: panel.matriz[orden[r]][c],
      // Se acota aquí, dentro del manejador: en render no se pueden leer refs.
      x: Math.min(px + 14, caja2.width - 152),
      y: py + 14,
    });
  };

  return (
    <div className="matriz-caja" ref={caja}>
      <canvas
        ref={lienzo}
        onMouseMove={mover}
        onMouseLeave={() => setEncima(null)}
      />
      {encima && (
        <div
          className="globo"
          style={{ left: `${encima.x}px`, top: `${encima.y}px` }}
        >
          <b>IES {encima.ies}</b>
          <span>{encima.anio}</span>
          <span className="globo-valor">{porcentaje(encima.tasa, 2)}</span>
        </div>
      )}
    </div>
  );
}
