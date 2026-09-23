import { cyrb128, mulberry32, uniformeAbierto } from "./prng";
import {
  acumulada,
  inversa,
  phi,
  probit,
  type Familia,
  type Parametros,
} from "./distribuciones";
import { AJUSTES, anios as aniosDe, parametrosDeAnio } from "./ajustes";

export interface Opciones {
  semilla: string;
  nIes: number;
  nAnios: number;
  familia: Familia;
  /** λ: parte permanente de la institución. 0 = cada año independiente. */
  icc: number;
  /** ρ: persistencia del componente transitorio (AR(1)). */
  rho: number;
  truncar: boolean;
}

export interface ResumenSerie {
  n: number;
  media: number;
  mediana: number;
  min: number;
  p10: number;
  p25: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
  ric: number;
  p90_p10: number;
  sd: number;
  cv: number;
  max: number;
  asimetria: number;
  curtosis: number;
}

/** Cuántos valores superan un umbral, y qué fracción del total son. */
export function porEncima(
  valores: number[],
  umbral: number,
): { n: number; frac: number } {
  const n = valores.reduce((a, x) => a + (x > umbral ? 1 : 0), 0);
  return { n, frac: valores.length ? n / valores.length : 0 };
}

export interface Panel {
  anios: number[];
  proyectado: boolean[];
  /** matriz[ies][anio] */
  matriz: number[][];
  /** Todos los valores en un solo arreglo, ordenado. */
  planoOrdenado: number[];
  porAnio: ResumenSerie[];
  global: ResumenSerie;
  /** ICC efectivamente realizado en la simulación, sobre log(tasa). */
  iccRealizado: number;
  /** Autocorrelación intra-IES realizada, por rezago 1..5. */
  acf: number[];
  paramsPorAnio: Parametros[];
}

function cuantil(ordenado: number[], q: number): number {
  if (ordenado.length === 0) return NaN;
  const h = (ordenado.length - 1) * q;
  const lo = Math.floor(h);
  const hi = Math.ceil(h);
  return ordenado[lo] + (ordenado[hi] - ordenado[lo]) * (h - lo);
}

export function resumir(valores: number[]): ResumenSerie {
  const o = [...valores].sort((a, b) => a - b);
  const n = o.length;
  const media = o.reduce((a, b) => a + b, 0) / n;
  const sd = Math.sqrt(
    o.reduce((a, b) => a + (b - media) * (b - media), 0) / Math.max(1, n - 1),
  );
  const p10 = cuantil(o, 0.1);
  const p25 = cuantil(o, 0.25);
  const p75 = cuantil(o, 0.75);
  const p90 = cuantil(o, 0.9);

  let m3 = 0;
  let m4 = 0;
  for (const v of o) {
    const z = (v - media) / sd;
    m3 += z * z * z;
    m4 += z * z * z * z;
  }

  return {
    n,
    media,
    mediana: cuantil(o, 0.5),
    min: o[0],
    p10,
    p25,
    p75,
    p90,
    p95: cuantil(o, 0.95),
    p99: cuantil(o, 0.99),
    ric: p75 - p25,
    p90_p10: p90 - p10,
    sd,
    cv: sd / media,
    max: o[n - 1],
    asimetria: m3 / n,
    curtosis: m4 / n - 3,
  };
}

/**
 * Simula un panel de instituciones × años.
 *
 * Cada año conserva exactamente su distribución marginal ajustada a los datos
 * reales. La dependencia usa el modelo de componentes que el análisis validó
 * frente a Markov y AR(1):
 *
 *     w_it = √λ·aᵢ + √(1−λ)·eᵢₜ ,   eᵢₜ = ρ·eᵢ,ₜ₋₁ + √(1−ρ²)·zᵢₜ
 *
 * aᵢ es el nivel permanente de la institución y eᵢₜ el transitorio persistente.
 * La autocorrelación resultante es r(h) = λ + (1−λ)·ρ^h, que es la forma medida
 * en los datos (λ = 0,540, ρ = 0,465). Una cadena de Markov daría r(h) = r(1)^h,
 * que decae demasiado rápido: a 5 años predice 0,17 cuando lo observado es 0,53.
 */
export function simularPanel(o: Opciones): Panel {
  const anios = aniosDe(o.nAnios);
  const rnd = mulberry32(
    cyrb128(
      `${o.semilla}|${o.familia}|${o.nIes}|${o.nAnios}|${o.icc}|${o.rho}|${o.truncar}`,
    ),
  );

  const paramsPorAnio: Parametros[] = [];
  const proyectado: boolean[] = [];
  const masa: number[] = [];
  for (const anio of anios) {
    const { params, proyectado: proy } = parametrosDeAnio(anio, o.familia);
    paramsPorAnio.push(params);
    proyectado.push(proy);
    masa.push(o.truncar ? acumulada(o.familia, 1, params) : 1);
  }

  const lambda = Math.min(0.98, Math.max(0, o.icc));
  const rho = Math.min(0.98, Math.max(0, o.rho));
  const raizLambda = Math.sqrt(lambda);
  const raizResto = Math.sqrt(1 - lambda);
  const innovacion = Math.sqrt(1 - rho * rho);

  // Efecto permanente de cada institución: se sortea una vez para toda su vida.
  const efectoIes = new Array<number>(o.nIes);
  for (let i = 0; i < o.nIes; i++) efectoIes[i] = probit(uniformeAbierto(rnd));

  const matriz: number[][] = [];
  for (let i = 0; i < o.nIes; i++) {
    const fila = new Array<number>(anios.length);
    // El transitorio arranca ya en su distribución estacionaria, para que el
    // primer año no tenga menos varianza que los demás.
    let transitorio = probit(uniformeAbierto(rnd));
    for (let t = 0; t < anios.length; t++) {
      if (t > 0) {
        transitorio =
          rho * transitorio + innovacion * probit(uniformeAbierto(rnd));
      }
      const w = raizLambda * efectoIes[i] + raizResto * transitorio;
      let u = phi(w);
      if (u <= 0) u = 1e-12;
      if (u >= 1) u = 1 - 1e-12;
      const x = inversa(o.familia, u * masa[t], paramsPorAnio[t]);
      fila[t] = Number.isFinite(x) && x > 0 ? Math.min(x, 1) : 1e-6;
    }
    matriz.push(fila);
  }

  const porAnio: ResumenSerie[] = [];
  for (let t = 0; t < anios.length; t++) {
    porAnio.push(resumir(matriz.map((f) => f[t])));
  }

  const plano = matriz.flat();
  const global = resumir(plano);

  return {
    anios,
    proyectado,
    matriz,
    planoOrdenado: [...plano].sort((a, b) => a - b),
    porAnio,
    global,
    iccRealizado: iccDe(matriz),
    acf: acfDe(matriz),
    paramsPorAnio,
  };
}

/**
 * Autocorrelación intra-institución por rezago, sobre log(tasa) desviada de la
 * media de cada año. Es la misma medida que separó los modelos en el análisis.
 */
function acfDe(matriz: number[][], rezagos = 5): number[] {
  const filas = matriz.length;
  const cols = matriz[0]?.length ?? 0;
  if (filas < 2 || cols < 2) return [];

  const logs = matriz.map((f) => f.map((x) => Math.log(x)));
  const mediaAnio = Array.from({ length: cols }, (_, t) => {
    let s = 0;
    for (let i = 0; i < filas; i++) s += logs[i][t];
    return s / filas;
  });
  const z = logs.map((f) => f.map((v, t) => v - mediaAnio[t]));

  const salida: number[] = [];
  for (let h = 1; h <= rezagos; h++) {
    if (h >= cols) {
      salida.push(NaN);
      continue;
    }
    const a: number[] = [];
    const b: number[] = [];
    for (let i = 0; i < filas; i++) {
      for (let t = 0; t + h < cols; t++) {
        a.push(z[i][t]);
        b.push(z[i][t + h]);
      }
    }
    const n = a.length;
    const ma = a.reduce((p, q) => p + q, 0) / n;
    const mb = b.reduce((p, q) => p + q, 0) / n;
    let cov = 0;
    let va = 0;
    let vb = 0;
    for (let k = 0; k < n; k++) {
      cov += (a[k] - ma) * (b[k] - mb);
      va += (a[k] - ma) * (a[k] - ma);
      vb += (b[k] - mb) * (b[k] - mb);
    }
    salida.push(cov / Math.sqrt(va * vb));
  }
  return salida;
}

/**
 * Matriz de transición entre quintiles, calculados dentro de cada año.
 * Es la única pieza de la descripción markoviana que el análisis conservó:
 * resultó homogénea en el tiempo (p = 0,78). Describe movilidad, no mecanismo.
 */
export function transicionQuintiles(matriz: number[][], S = 5): number[][] {
  const filas = matriz.length;
  const cols = matriz[0]?.length ?? 0;
  if (filas < S || cols < 2) return [];

  const q: number[][] = Array.from({ length: filas }, () =>
    new Array<number>(cols).fill(0),
  );
  for (let t = 0; t < cols; t++) {
    const orden = Array.from({ length: filas }, (_, i) => i).sort(
      (a, b) => matriz[a][t] - matriz[b][t],
    );
    orden.forEach((i, puesto) => {
      q[i][t] = Math.min(S - 1, Math.floor((puesto * S) / filas));
    });
  }

  const N = Array.from({ length: S }, () => new Array<number>(S).fill(0));
  for (let i = 0; i < filas; i++) {
    for (let t = 0; t + 1 < cols; t++) N[q[i][t]][q[i][t + 1]]++;
  }
  return N.map((fila) => {
    const s = fila.reduce((a, b) => a + b, 0);
    return s ? fila.map((v) => v / s) : fila;
  });
}

/** ICC de una vía sobre log(tasa): cuánta varianza vive entre instituciones. */
export function iccRecomendado(): number {
  return AJUSTES.icc;
}

function iccDe(matriz: number[][]): number {
  const a = matriz.length;
  const k = matriz[0]?.length ?? 0;
  if (a < 2 || k < 2) return NaN;
  const logs = matriz.map((f) => f.map((x) => Math.log(x)));
  const mediasIes = logs.map((f) => f.reduce((p, q) => p + q, 0) / k);
  const media = mediasIes.reduce((p, q) => p + q, 0) / a;

  let ssEntre = 0;
  for (const m of mediasIes) ssEntre += k * (m - media) * (m - media);
  let ssDentro = 0;
  logs.forEach((f, i) => {
    for (const x of f) ssDentro += (x - mediasIes[i]) * (x - mediasIes[i]);
  });

  const msEntre = ssEntre / (a - 1);
  const msDentro = ssDentro / (a * (k - 1));
  return (msEntre - msDentro) / (msEntre + (k - 1) * msDentro);
}
