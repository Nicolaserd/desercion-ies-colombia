# Deserción en la educación superior colombiana

Análisis de la distribución y la dinámica de las tasas de deserción por
institución de educación superior (IES), a partir de los datos de **SPADIES**
2010–2024 del Ministerio de Educación Nacional: 289 instituciones, 3.930
observaciones institución-año.

El repositorio contiene el cuaderno de análisis y un simulador que genera
paneles sintéticos a partir del modelo ajustado.

---

## Hallazgos

**La distribución no es lognormal.** La intuición de trabajar en escala
logarítmica es correcta —la asimetría pasa de +3,06 a +0,17— pero el log no es
normal: es leptocúrtico, con colas más pesadas. La lognormal queda rechazada por
Anderson–Darling con p-valores por Monte Carlo (p = 0,006). La familia que sí
ajusta es la **log-logística (Fisk)**, la lognormal con colas pesadas.

**No es una ley de potencias.** La Pareto pura queda penúltima de 13 familias
(ΔAIC = 181), la cola empírica cubre menos de una década cuando el criterio de
Clauset–Shalizi–Newman pide al menos dos, y el cuerpo de la distribución tiene
una moda interior en torno al 9% que una potencia monótona no puede producir.
El exponente que un ajuste de cola recupera (α̂ = 3,13) no es evidencia nueva:
reproduce la forma ya estimada de la log-logística (c = 3,11).

**No es una cadena de Markov.** La propiedad de Markov se rechaza en el
contraste de orden 2 contra orden 1 (p ≈ 1e-75). A cinco años la cadena predice
que el 31% de las IES seguirá en el quintil más alto; el dato es 56%. El error
tiene una causa: la cadena olvida qué institución es.

**Es un proceso de componentes de varianza.** La autocorrelación intra-IES no
decae geométricamente: a cinco años vale 0,53, no el 0,17 que exigiría un
proceso markoviano. Se ajusta con un nivel permanente más un transitorio
persistente, r(h) = λ + (1−λ)·ρ^h, con λ = 0,540 y ρ = 0,465 — un error
cuadrático 76 veces menor que el del modelo geométrico.

**La institución pesa veinte veces más que el año.** En la descomposición de la
varianza de log(tasa): el año explica el 3,1%, la institución el 58,5%, el
residuo idiosincrásico el 38,6%.

---

## Contenido

| Archivo | Qué es |
|---|---|
| `DISPERSION_DESERCION.ipynb` | El análisis completo, en cuatro partes, con las figuras ya renderizadas |
| `SPADIES_ALL.xlsx` | Datos de origen: tasa de deserción anual por IES, 2010–2024 |
| `simulador-desercion/` | Simulador en Next.js 16 + React 19 + TypeScript |
| `simulador_desercion.html` | Versión de una sola página, sin dependencias: se abre con doble clic |

### El cuaderno

1. **Dispersión** — distribución global, cajas y violines por año, ECDF,
   evolución de la dispersión. El RIC cae de 12,9% a 7,5% entre 2010 y 2024.
2. **¿Qué distribución encaja?** — 13 familias por máxima verosimilitud, ranking
   por AIC/BIC y bondad de ajuste con p-valores por Monte Carlo. Incluye la
   verificación de supuestos: el ICC de 0,553 reduce el tamaño muestral efectivo
   de 3.930 a 494, así que la inferencia válida se hace sobre una observación
   por institución.
3. **¿Ley de potencias?** — procedimiento de Clauset–Shalizi–Newman, con
   selección de `xmin`, bootstrap semiparamétrico y contrastes de razón de
   verosimilitud de Vuong.
4. **Estructura de dependencia** — Markov contra AR(1) contra componentes de
   varianza, matriz de transición entre quintiles, y patrones de movilidad y
   trayectoria.

### El simulador

Genera un panel de instituciones × años reproducible por semilla. Cada año
conserva su distribución marginal ajustada; la dependencia entre los años de una
misma institución usa una cópula gaussiana con la estructura de componentes
validada en la parte 4:

```
w_it = √λ·aᵢ + √(1−λ)·eᵢₜ ,   eᵢₜ = ρ·eᵢ,ₜ₋₁ + √(1−ρ²)·zᵢₜ
```

Parámetros ajustables: número de IES, número de años, semilla, familia de
distribución, λ, ρ, truncamiento en 100% y umbral de alerta.

```bash
cd simulador-desercion
npm install
npm run dev
```

---

## Reproducir el análisis

```bash
pip install pandas numpy scipy matplotlib seaborn openpyxl jupyter
jupyter notebook DISPERSION_DESERCION.ipynb
```

El cuaderno tarda unos cuatro minutos en ejecutarse completo: los p-valores por
Monte Carlo y el bootstrap de la ley de potencias son la parte costosa.

---

## Advertencias de método

- Se excluye el 1,3% de observaciones con tasas de 0% o 100% exactos: la familia
  log- no está definida en 0. Son instituciones de cohorte mínima. Un modelo
  completo del sistema sería mixto: masa puntual en los bordes más log-logística
  en el interior.
- Los p-valores calculados sobre las 3.930 filas no son interpretables por la
  dependencia intra-institución. El cuaderno los reporta solo para mostrar que
  el contraste agrupado rechaza todo por construcción.
- Distinguir log-logística de log-Laplace con 289 observaciones es exigirle
  mucho a los datos (ΔAIC = 3,8). Lo robusto es la familia, no la ganadora
  exacta.
- El modelo dice cuánta variación es institucional, no por qué. El paso
  siguiente es explicar el efecto institución con covariables: tamaño de
  cohorte, carácter público o privado, región, nivel de formación.

---

## Fuente

SPADIES — Sistema para la Prevención de la Deserción de la Educación Superior,
Ministerio de Educación Nacional de Colombia.
