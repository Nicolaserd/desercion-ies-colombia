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
normal: es leptocúrtico, con colas más pesadas. La lognormal se rechaza por
Anderson–Darling **en los quince años**, con el p-valor en el mínimo alcanzable.
Lo mismo la gamma y la Weibull.

**La familia que ajusta es la log-Laplace.** Probadas año por año sobre cortes
transversales —donde cada institución aparece una sola vez y no hay medidas
repetidas—, la log-Laplace no se rechaza en **12 de 15 años** (p mediano 0,150),
la Burr XII en 7 y la log-logística en 5. El resultado se confirma fuera de
muestra partiendo las instituciones en dos mitades: p = 0,464 en la mitad que no
participó en la elección.

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
varianza de log(tasa), con sumas de cuadrados tipo II: el año explica el 3,1%, la
institución el 58,5%, el residuo idiosincrásico el 38,5%, y el solapamiento entre
los dos efectos es de 0,01% — son prácticamente ortogonales.

**Hay atrición selectiva, y compromete la lectura del descenso.** De las 289
instituciones, 22 dejan de aparecer antes de 2024, y su deserción mediana es
**2,6 veces** la de las que permanecen (29,6% contra 11,3%, Mann-Whitney
p < 0,0001). Parte de la caída de la mediana del sistema —de 14,0% a 9,7%— es
composición de la muestra, no mejora. Con este archivo no se pueden separar
ambas causas.

---

## Contenido

| Archivo | Qué es |
|---|---|
| `DISPERSION_DESERCION.ipynb` | El análisis completo, en cuatro partes, con las figuras ya renderizadas |
| `SPADIES_ALL.xlsx` | Datos de origen: tasa de deserción anual por IES, 2010–2024 |
| `simulador-desercion/` | Simulador de paneles en Next.js 16 + React 19 + TypeScript |
| `simulador_desercion.html` | Simulador de un solo corte transversal, en un archivo sin dependencias |

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
5. **Auditoría crítica** — ataca las conclusiones de las partes anteriores. Dos
   no sobreviven: el diseño de la inferencia de la parte 2 estaba mal planteado
   (resumir por medianas mezcla quince años con escalas distintas en lugar de
   usar el corte anual, que ya es independiente), lo que invierte el ganador; y
   la atrición selectiva matiza el descenso de la parte 1. Incluye validación
   fuera de muestra, intervalos de confianza por bootstrap, sensibilidad a los
   extremos excluidos y descomposición de varianza tipo II.

### Los simuladores

Son dos, con alcances distintos.

**`simulador-desercion/`** genera un **panel** de instituciones × años,
reproducible por semilla. Cada año conserva su distribución marginal ajustada; la
dependencia entre los años de una misma institución usa una cópula gaussiana con
la estructura de componentes validada en la parte 4:

```
w_it = √λ·aᵢ + √(1−λ)·eᵢₜ ,   eᵢₜ = ρ·eᵢ,ₜ₋₁ + √(1−ρ²)·zᵢₜ
```

Parámetros ajustables: número de IES, número de años, semilla, familia de
distribución, λ, ρ, truncamiento en 100% y umbral de alerta. Muestra la matriz
IES × años, la matriz de transición entre quintiles, la autocorrelación por
rezago frente a lo que exigiría Markov, un Q-Q contra los datos reales y la
tabla completa de estadísticas.

```bash
cd simulador-desercion
npm install
npm run dev
```

**`simulador_desercion.html`** es anterior y más modesto: simula **un solo corte
transversal** —N instituciones en un año— sin estructura temporal ni parámetros
de dependencia. Se abre con doble clic, sin instalar nada. Sirve para explorar la
forma de la distribución; para todo lo demás, use el de Next.js.

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

- **Todas las cifras son por institución, nunca por estudiante.** El archivo trae
  tasas, no matrículas: una IES de 50 estudiantes pesa lo mismo que una de
  50.000. "La mediana es 9,7%" significa *la institución mediana tiene 9,7%*, no
  *el 9,7% de los estudiantes deserta*.
- **Atrición selectiva.** Las 22 instituciones que salen del panel tienen 2,6
  veces más deserción que las que permanecen. El descenso observado mezcla mejora
  real con cambio de composición, y este archivo no permite separarlos.
- Se excluye el 1,3% de observaciones con tasas de 0% o 100% exactos: la familia
  log- no está definida en 0. Son instituciones de cohorte mínima. La ganadora no
  cambia al incluirlas desplazadas, pero sí cambian las distancias entre las
  demás. Un modelo completo sería mixto: masa puntual en los bordes más
  log-Laplace en el interior.
- Los p-valores calculados sobre las 3.930 filas agrupadas no son interpretables
  por la dependencia intra-institución (ICC = 0,553, n efectivo ≈ 494). El
  cuaderno los reporta solo para mostrar que el contraste agrupado rechaza todo
  por construcción.
- **Los intervalos son anchos.** La forma de la log-Laplace en 2024 es 2,04 con
  IC95% [1,83, 2,34]; la de la log-logística, 2,82 con [2,48, 3,19]. Con ~265
  instituciones no se afina más: diferencias dentro de ese margen son ruido.
- La log-Laplace ajusta mejor pero tiene un pico anguloso en la moda —su densidad
  no es derivable ahí—, lo que es incómodo como modelo generativo. La
  log-logística es más suave y en varios años la diferencia cabe dentro del
  intervalo de confianza. Lo robusto es la familia log- de colas pesadas, no la
  ganadora exacta.
- El modelo dice cuánta variación es institucional, no por qué. El paso
  siguiente es explicar el efecto institución con covariables: tamaño de
  cohorte, carácter público o privado, región, nivel de formación.

---

## Fuente

SPADIES — Sistema para la Prevención de la Deserción de la Educación Superior,
Ministerio de Educación Nacional de Colombia.
