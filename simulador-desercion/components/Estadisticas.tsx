"use client";

import { AJUSTES } from "@/lib/ajustes";
import { numero, porcentaje } from "@/lib/escala";
import { porEncima, resumir, type Panel, type ResumenSerie } from "@/lib/simular";

interface Props {
  panel: Panel;
  umbral: number;
  cambiarUmbral: (v: number) => void;
}

export default function Estadisticas({ panel, umbral, cambiarUmbral }: Props) {
  const ultimo = panel.anios[panel.anios.length - 1];
  const ultimoAnio = panel.matriz.map((f) => f[f.length - 1]);
  const real = AJUSTES.anios[String(ultimo)]?.valores ?? null;

  const sUlt = panel.porAnio[panel.porAnio.length - 1];
  const sTodo = panel.global;

  const corteUlt = porEncima(ultimoAnio, umbral);
  const cortePanel = porEncima(panel.planoOrdenado, umbral);
  const corteReal = real ? porEncima(real, umbral) : null;

  // Cuántas instituciones superan el umbral al menos una vez en su historia.
  const alMenosUna = panel.matriz.filter((f) => f.some((x) => x > umbral)).length;
  // Y cuántas lo superan siempre.
  const siempre = panel.matriz.filter((f) => f.every((x) => x > umbral)).length;

  const sReal: ResumenSerie | null = real ? resumir(real) : null;

  const pc = (f: (r: ResumenSerie) => number) => (r: ResumenSerie | null) =>
    r ? porcentaje(f(r), 2) : "—";
  const nu = (f: (r: ResumenSerie) => number) => (r: ResumenSerie | null) =>
    r ? numero(f(r)) : "—";

  const filas: [string, (r: ResumenSerie | null) => string, string][] = [
    ["Media", pc((r) => r.media), "promedio aritmético"],
    ["Mediana", pc((r) => r.mediana), "el valor del medio"],
    ["Desv. estándar", pc((r) => r.sd), "dispersión absoluta"],
    ["Coef. de variación", nu((r) => r.cv), "dispersión relativa a la media"],
    ["RIC (p75 − p25)", pc((r) => r.ric), "ancho del 50% central"],
    ["Rango p90 − p10", pc((r) => r.p90_p10), "ancho del 80% central"],
    ["Asimetría", nu((r) => r.asimetria), "0 = simétrica"],
    ["Curtosis (exceso)", nu((r) => r.curtosis), "0 = normal"],
    ["Mínimo", pc((r) => r.min), "—"],
    ["Percentil 10", pc((r) => r.p10), "—"],
    ["Percentil 25", pc((r) => r.p25), "—"],
    ["Percentil 75", pc((r) => r.p75), "—"],
    ["Percentil 90", pc((r) => r.p90), "—"],
    ["Percentil 95", pc((r) => r.p95), "—"],
    ["Percentil 99", pc((r) => r.p99), "—"],
    ["Máximo", pc((r) => r.max), "—"],
  ];

  return (
    <>
      <div className="umbral">
        <label htmlFor="umbral">
          Umbral de alerta <b>{porcentaje(umbral, 0)}</b>
        </label>
        <input
          id="umbral"
          type="range"
          min={0.1}
          max={0.95}
          step={0.05}
          value={umbral}
          onChange={(e) => cambiarUmbral(Number(e.target.value))}
        />
        <span className="umbral-nota">
          Mueva el umbral para contar instituciones por encima de cualquier nivel.
        </span>
      </div>

      <div className="tarjetas kpi">
        <div className="tarjeta alerta">
          <span className="clave">Sobre {porcentaje(umbral, 0)} en {ultimo}</span>
          <span className="valor">{corteUlt.n}</span>
          <span className="contraste">
            {porcentaje(corteUlt.frac, 1)} de {panel.matriz.length} IES
          </span>
        </div>
        <div className="tarjeta alerta">
          <span className="clave">Real {ultimo}</span>
          <span className="valor">{corteReal ? corteReal.n : "—"}</span>
          <span className="contraste">
            {corteReal
              ? `${porcentaje(corteReal.frac, 1)} de ${real!.length} IES`
              : "año proyectado"}
          </span>
        </div>
        <div className="tarjeta alerta">
          <span className="clave">Todo el panel</span>
          <span className="valor">{cortePanel.n}</span>
          <span className="contraste">
            {porcentaje(cortePanel.frac, 1)} de{" "}
            {panel.planoOrdenado.length.toLocaleString("es-CO")} obs.
          </span>
        </div>
        <div className="tarjeta alerta">
          <span className="clave">Lo superan alguna vez</span>
          <span className="valor">{alMenosUna}</span>
          <span className="contraste">
            {porcentaje(alMenosUna / panel.matriz.length, 1)} de las IES
          </span>
        </div>
        <div className="tarjeta alerta">
          <span className="clave">Lo superan todos los años</span>
          <span className="valor">{siempre}</span>
          <span className="contraste">
            {porcentaje(siempre / panel.matriz.length, 1)} de las IES
          </span>
        </div>
      </div>

      <div className="tabla-caja">
        <table>
          <thead>
            <tr>
              <th className="izq">Medida</th>
              <th>Simulado {ultimo}</th>
              <th className="col-real">Real {ultimo}</th>
              <th>Panel completo</th>
              <th className="izq">Qué mide</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(([nombre, fmt, nota]) => (
              <tr key={nombre}>
                <td className="izq">{nombre}</td>
                <td>{fmt(sUlt)}</td>
                <td className="col-real">{fmt(sReal)}</td>
                <td>{fmt(sTodo)}</td>
                <td className="izq tenue">{nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
