import bruto from "@/data/ajustes.json";
import type { Familia, Parametros } from "./distribuciones";

export interface ResumenAnio {
  n: number;
  mediana: number;
  ric: number;
  p90_p10: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  sd: number;
  cv: number;
  max: number;
}

export interface AjusteAnio {
  fisk: Parametros;
  burr12: Parametros;
  loglaplace: Parametros;
  lognorm: Parametros;
  resumen: ResumenAnio;
  valores: number[];
}

export interface FichaFamilia {
  clave: Familia;
  nombre: string;
  dAIC: number;
  pAD: number;
  estado: "compatible" | "rechazada";
  campos: [string, string][];
  nota: string;
}

export interface Dependencia {
  /** Parte permanente de la institución en la varianza de log(tasa). */
  lambda: number;
  /** Persistencia del componente transitorio, AR(1). */
  rho: number;
  /** Autocorrelación intra-IES medida en los datos reales, por rezago. */
  acfReal: Record<string, number>;
  transicion: number[][];
  varianza: { anio: number; institucion: number; residuo: number };
}

export interface Ajustes {
  anios: Record<string, AjusteAnio>;
  anioMin: number;
  anioMax: number;
  icc: number;
  tendencia: {
    escala: { pendiente: number; intercepto: number };
    forma: { pendiente: number; intercepto: number };
  };
  familias: FichaFamilia[];
  dependencia: Dependencia;
}

export const AJUSTES = bruto as unknown as Ajustes;

/**
 * Parámetros de un año. Los años con datos reales usan su ajuste por máxima
 * verosimilitud; más allá de 2024 se proyecta la escala con su tendencia
 * log-lineal observada (−2,75% anual) y se conserva la forma del último año.
 */
export function parametrosDeAnio(
  anio: number,
  familia: Familia,
): { params: Parametros; proyectado: boolean } {
  const clave = String(anio);
  const directo = AJUSTES.anios[clave];
  if (directo) return { params: directo[familia], proyectado: false };

  const ancla = AJUSTES.anios[String(AJUSTES.anioMax)][familia];
  const factor = Math.exp(
    AJUSTES.tendencia.escala.pendiente * (anio - AJUSTES.anioMax),
  );
  return { params: { ...ancla, s: ancla.s * factor }, proyectado: true };
}

/** Los `cantidad` años que se simulan, anclados en los datos reales. */
export function anios(cantidad: number): number[] {
  const { anioMin, anioMax } = AJUSTES;
  const disponibles = anioMax - anioMin + 1;
  const inicio = cantidad <= disponibles ? anioMax - cantidad + 1 : anioMin;
  return Array.from({ length: cantidad }, (_, i) => inicio + i);
}
