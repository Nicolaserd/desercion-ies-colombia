/**
 * Las cuatro familias que compitieron por ajustar las tasas de deserción de
 * SPADIES, cada una con su inversa exacta para muestrear por inversión de CDF.
 */

export type Familia = "fisk" | "burr12" | "loglaplace" | "lognorm";

export type Parametros = {
  c?: number;
  d?: number;
  s: number;
  sigma?: number;
};

/** Función error, aproximación de Abramowitz-Stegun 7.1.26. */
export function erf(x: number): number {
  const signo = Math.sign(x);
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return signo * y;
}

/** Acumulada de la normal estándar. */
export function phi(z: number): number {
  return 0.5 * (1 + erf(z / Math.SQRT2));
}

/** Inversa de la normal estándar (Acklam). Error relativo < 1.15e-9. */
export function probit(p: number): number {
  const a = [
    -3.969683028665376e1, 2.209460984245205e2, -2.759285104469687e2,
    1.38357751867269e2, -3.066479806614716e1, 2.506628277459239,
  ];
  const b = [
    -5.447609879822406e1, 1.615858368580409e2, -1.556989798598866e2,
    6.680131188771972e1, -1.328068155288572e1,
  ];
  const c = [
    -7.784894002430293e-3, -3.223964580411365e-1, -2.400758277161838,
    -2.549732539343734, 4.374664141464968, 2.938163982698783,
  ];
  const d = [
    7.784695709041462e-3, 3.224671290700398e-1, 2.445134137142996,
    3.754408661907416,
  ];
  const bajo = 0.02425;
  if (p <= 0) return -Infinity;
  if (p >= 1) return Infinity;
  if (p < bajo) {
    const q = Math.sqrt(-2 * Math.log(p));
    return (
      (((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  if (p > 1 - bajo) {
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return (
      -(((((c[0] * q + c[1]) * q + c[2]) * q + c[3]) * q + c[4]) * q + c[5]) /
      ((((d[0] * q + d[1]) * q + d[2]) * q + d[3]) * q + 1)
    );
  }
  const q = p - 0.5;
  const r = q * q;
  return (
    ((((((a[0] * r + a[1]) * r + a[2]) * r + a[3]) * r + a[4]) * r + a[5]) * q) /
    (((((b[0] * r + b[1]) * r + b[2]) * r + b[3]) * r + b[4]) * r + 1)
  );
}

/** Cuantil: x tal que P(X ≤ x) = u. */
export function inversa(familia: Familia, u: number, p: Parametros): number {
  switch (familia) {
    case "fisk":
      return p.s * Math.pow(u / (1 - u), 1 / (p.c as number));
    case "burr12":
      return (
        p.s *
        Math.pow(Math.pow(1 - u, -1 / (p.d as number)) - 1, 1 / (p.c as number))
      );
    case "loglaplace": {
      const c = p.c as number;
      return p.s * (u < 0.5 ? Math.pow(2 * u, 1 / c) : Math.pow(2 * (1 - u), -1 / c));
    }
    case "lognorm":
      return p.s * Math.exp((p.sigma as number) * probit(u));
  }
}

/** Acumulada: P(X ≤ x). */
export function acumulada(familia: Familia, x: number, p: Parametros): number {
  if (x <= 0) return 0;
  switch (familia) {
    case "fisk":
      return 1 / (1 + Math.pow(x / p.s, -(p.c as number)));
    case "burr12":
      return (
        1 - Math.pow(1 + Math.pow(x / p.s, p.c as number), -(p.d as number))
      );
    case "loglaplace": {
      const y = x / p.s;
      const c = p.c as number;
      return y < 1 ? 0.5 * Math.pow(y, c) : 1 - 0.5 * Math.pow(y, -c);
    }
    case "lognorm":
      return phi(Math.log(x / p.s) / (p.sigma as number));
  }
}

/** Densidad. */
export function densidad(familia: Familia, x: number, p: Parametros): number {
  if (x <= 0) return 0;
  switch (familia) {
    case "fisk": {
      const c = p.c as number;
      const y = Math.pow(x / p.s, c);
      return ((c / p.s) * Math.pow(x / p.s, c - 1)) / Math.pow(1 + y, 2);
    }
    case "burr12": {
      const c = p.c as number;
      const d = p.d as number;
      const y = Math.pow(x / p.s, c);
      return ((c * d) / p.s) * Math.pow(x / p.s, c - 1) * Math.pow(1 + y, -d - 1);
    }
    case "loglaplace": {
      const c = p.c as number;
      const y = x / p.s;
      return (c / (2 * p.s)) * (y < 1 ? Math.pow(y, c - 1) : Math.pow(y, -c - 1));
    }
    case "lognorm": {
      const sg = p.sigma as number;
      const l = Math.log(x / p.s);
      return (
        Math.exp((-l * l) / (2 * sg * sg)) / (x * sg * Math.sqrt(2 * Math.PI))
      );
    }
  }
}

/** Supervivencia: P(X > x). */
export function supervivencia(
  familia: Familia,
  x: number,
  p: Parametros,
): number {
  return 1 - acumulada(familia, x, p);
}
