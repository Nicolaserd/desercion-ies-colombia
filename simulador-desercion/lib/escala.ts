/**
 * Bandas de deserción. Los cortes no son redondos por gusto: salen de los
 * percentiles de los datos reales (p10 ≈ 5%, mediana ≈ 11%, p75 ≈ 15%,
 * p90 ≈ 27%). La rampa es azul secuencial —oscuro es poco, brillante es
 * mucho— y el rojo queda reservado para la cola que el análisis señaló.
 */
export interface Banda {
  hasta: number;
  color: string;
  etiqueta: string;
}

export const BANDAS: Banda[] = [
  { hasta: 0.05, color: "#12324f", etiqueta: "menos de 5%" },
  { hasta: 0.1, color: "#1b5488", etiqueta: "5 – 10%" },
  { hasta: 0.15, color: "#2a78d6", etiqueta: "10 – 15%" },
  { hasta: 0.25, color: "#7fb2ee", etiqueta: "15 – 25%" },
  { hasta: Infinity, color: "#e34948", etiqueta: "25% o más" },
];

export function colorDe(tasa: number): string {
  for (const b of BANDAS) if (tasa < b.hasta) return b.color;
  return BANDAS[BANDAS.length - 1].color;
}

export const porcentaje = (x: number, decimales = 1): string =>
  `${(x * 100).toFixed(decimales).replace(".", ",")}%`;

export const numero = (x: number, decimales = 3): string =>
  x.toFixed(decimales).replace(".", ",");
