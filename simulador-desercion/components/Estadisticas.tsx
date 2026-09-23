"use client";

import { AJUSTES } from "@/lib/ajustes";
import { numero, porcentaje } from "@/lib/escala";
import { porEncima, type Panel } from "@/lib/simular";

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

  const filas: [string, string, string, string][] = [
    ["Media", porcentaje(sUlt.media, 2), porcentaje(sTodo.media, 2), "promedio aritmético"],
    ["Mediana", porcentaje(sUlt.mediana, 2), porcentaje(sTodo.mediana, 2), "el valor del medio"],
    ["Desv. estándar", porcentaje(sUlt.sd, 2), porcentaje(sTodo.sd, 2), "dispersión absoluta"],
    ["Coef. de variación", numero(sUlt.cv), numero(sTodo.cv), "dispersión relativa a la media"],
    ["RIC (p75 − p25)", porcentaje(sUlt.ric, 2), porcentaje(sTodo.ric, 2), "ancho del 50% central"],
    ["Rango p90 − p10", porcentaje(sUlt.p90_p10, 2), porcentaje(sTodo.p90_p10, 2), "ancho del 80% central"],
    ["Asimetría", numero(sUlt.asimetria, 2), numero(sTodo.asimetria, 2), "0 = simétrica"],
    ["Curtosis (exceso)", numero(sUlt.curtosis, 2), numero(sTodo.curtosis, 2), "0 = normal"],
    ["Mínimo", porcentaje(sUlt.min, 2), porcentaje(sTodo.min, 2), "—"],
    ["Percentil 10", porcentaje(sUlt.p10, 2), porcentaje(sTodo.p10, 2), "—"],
    ["Percentil 25", porcentaje(sUlt.p25, 2), porcentaje(sTodo.p25, 2), "—"],
    ["Percentil 75", porcentaje(sUlt.p75, 2), porcentaje(sTodo.p75, 2), "—"],
    ["Percentil 90", porcentaje(sUlt.p90, 2), porcentaje(sTodo.p90, 2), "—"],
    ["Percentil 95", porcentaje(sUlt.p95, 2), porcentaje(sTodo.p95, 2), "—"],
    ["Percentil 99", porcentaje(sUlt.p99, 2), porcentaje(sTodo.p99, 2), "—"],
    ["Máximo", porcentaje(sUlt.max, 2), porcentaje(sTodo.max, 2), "—"],
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
              <th>Medida</th>
              <th>{ultimo}</th>
              <th>Panel completo</th>
              <th className="izq">Qué mide</th>
            </tr>
          </thead>
          <tbody>
            {filas.map(([nombre, a, b, nota]) => (
              <tr key={nombre}>
                <td className="izq">{nombre}</td>
                <td>{a}</td>
                <td>{b}</td>
                <td className="izq tenue">{nota}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
