"use client";

import { useMemo, useState } from "react";
import BarraControles, { type Estado } from "./BarraControles";
import Matriz from "./Matriz";
import Transicion from "./Transicion";
import ComparacionQQ from "./ComparacionQQ";
import Memoria from "./Memoria";
import Estadisticas from "./Estadisticas";
import { simularPanel } from "@/lib/simular";
import { AJUSTES } from "@/lib/ajustes";
import { BANDAS, numero } from "@/lib/escala";

const INICIAL: Estado = {
  nIes: 289,
  nAnios: 15,
  semilla: "spadies-2024",
  // La auditoría (parte 5 del cuaderno) invirtió la recomendación: sobre cortes
  // transversales anuales, la log-Laplace no se rechaza en 12 de 15 años; la
  // log-logística, solo en 5.
  familia: "loglaplace",
  icc: AJUSTES.dependencia.lambda,
  rho: AJUSTES.dependencia.rho,
  truncar: true,
  ordenar: true,
};

export default function Simulador() {
  const [estado, setEstado] = useState<Estado>(INICIAL);
  const [umbral, setUmbral] = useState(0.7);

  const cambiar = <K extends keyof Estado>(clave: K, valor: Estado[K]) =>
    setEstado((e) => ({ ...e, [clave]: valor }));

  const panel = useMemo(
    () =>
      simularPanel({
        semilla: estado.semilla || "spadies",
        nIes: estado.nIes,
        nAnios: estado.nAnios,
        familia: estado.familia,
        icc: estado.icc,
        rho: estado.rho,
        truncar: estado.truncar,
      }),
    [estado],
  );

  const ficha = AJUSTES.familias.find((f) => f.clave === estado.familia)!;
  const ultimo = panel.anios[panel.anios.length - 1];
  const proyectados = panel.proyectado.filter(Boolean).length;

  return (
    <>
      <BarraControles
        estado={estado}
        cambiar={cambiar}
        alAzar={() =>
          cambiar("semilla", `ies-${Math.random().toString(36).slice(2, 8)}`)
        }
        reiniciar={() => setEstado(INICIAL)}
      />

      <p className="resumen-corrida">
        <span>
          <b>{panel.matriz.length.toLocaleString("es-CO")}</b> instituciones ×{" "}
          <b>{panel.anios.length}</b> años ={" "}
          <b>
            {(panel.matriz.length * panel.anios.length).toLocaleString("es-CO")}
          </b>{" "}
          observaciones
        </span>
        <span>
          {panel.anios[0]}–{ultimo}
          {proyectados > 0 && (
            <em> · {proyectados} año(s) proyectados más allá de 2024</em>
          )}
        </span>
        <span>
          λ pedido <b>{estado.icc.toFixed(3)}</b> · realizado{" "}
          <b>{numero(panel.iccRealizado)}</b>
        </span>
      </p>

      <div className="tablero">
        <section className="panel">
          <div className="panel-cabeza">
            <h2>Panel de instituciones</h2>
            <p>
              Cada fila es una institución; cada columna, un año. El color es su
              tasa de deserción.
            </p>
          </div>
          <Matriz panel={panel} ordenar={estado.ordenar} />
          <div className="leyenda">
            <span className="leyenda-titulo">Deserción</span>
            {BANDAS.map((b) => (
              <span key={b.etiqueta} className="leyenda-item">
                <i style={{ background: b.color }} />
                {b.etiqueta}
              </span>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-cabeza">
            <h2>Movilidad entre quintiles</h2>
            <p>
              Probabilidad de pasar de un quintil a otro en un año. Es la única
              pieza markoviana que sobrevivió: la matriz resultó estable en el
              tiempo (p = 0,78).
            </p>
          </div>
          <Transicion panel={panel} />
        </section>
      </div>

      <div className="tablero">
        <section className="panel">
          <div className="panel-cabeza">
            <h2>Memoria del panel</h2>
            <p>
              Correlación entre los años de una misma institución. Es la medida
              que descartó a Markov: exigiría que la memoria cayera como r(1)^h,
              y no cae.
            </p>
          </div>
          <Memoria acf={panel.acf} />
        </section>

        <section className="panel">
          <div className="panel-cabeza">
            <h2>¿Reproduce la distribución real?</h2>
            <p>
              Cuantil a cuantil contra SPADIES {ultimo}. Si la simulación es
              fiel, los puntos caen sobre la diagonal.
            </p>
          </div>
          <ComparacionQQ panel={panel} />
        </section>
      </div>

      <section className="panel">
        <div className="panel-cabeza">
          <h2>Estadísticas completas y alertas</h2>
          <p>
            Todas las medidas de posición, dispersión y forma, más el conteo de
            instituciones por encima del umbral que elija.
          </p>
        </div>
        <Estadisticas
          panel={panel}
          umbral={umbral}
          cambiarUmbral={setUmbral}
        />
      </section>

      <section className="panel nota">
        <h2>{ficha.nombre}</h2>
        <p>{ficha.nota}</p>
        <p>
          Probada sobre los 15 cortes transversales anuales:{" "}
          <b>
            no se rechaza en {ficha.aniosSinRechazo} de 15 años
          </b>{" "}
          (Anderson–Darling por Monte Carlo, p mediano{" "}
          <b>{numero(ficha.pMediano, 3)}</b>).
        </p>
        <p>
          Advertencia sobre los datos: {AJUSTES.auditoria.atricion.iesQueSalen}{" "}
          instituciones dejan de aparecer antes de 2024, y su deserción mediana
          es{" "}
          <b>
            {(
              AJUSTES.auditoria.atricion.medianaSalen /
              AJUSTES.auditoria.atricion.medianaSiguen
            ).toFixed(1)}
            ×
          </b>{" "}
          la de las que permanecen. Parte del descenso observado es composición
          de la muestra, no mejora. Y todas las cifras son por institución, nunca
          por estudiante: el archivo no trae matrículas.
        </p>
        <p>
          La dependencia entre años <b>no es markoviana</b>. Se modela con dos
          piezas: <b>λ = {numero(AJUSTES.dependencia.lambda)}</b> es el nivel
          permanente de cada institución, y <b>ρ = {numero(AJUSTES.dependencia.rho)}</b>{" "}
          la persistencia de lo transitorio. Juntas dan r(h) = λ + (1−λ)·ρ^h, que
          es la forma medida en los datos. Una cadena de Markov impondría
          r(h) = r(1)^h y a cinco años predeciría 0,17 donde lo observado es 0,53.
        </p>
        <p>
          En la descomposición de la varianza de log(tasa), el año explica el{" "}
          <b>{(AJUSTES.dependencia.varianza.anio * 100).toFixed(1)}%</b> y la
          institución el{" "}
          <b>{(AJUSTES.dependencia.varianza.institucion * 100).toFixed(1)}%</b>.
          Baje λ a 0 y el panel pierde sus franjas horizontales; súbalo a 0,9 y
          cada fila se vuelve casi constante.
        </p>
      </section>
    </>
  );
}
