import Simulador from "@/components/Simulador";

export default function Page() {
  return (
    <main className="envoltura">
      <header className="cabecera">
        <h1>Simulador de Deserción SPADIES</h1>
        <p>
          Genera un panel sintético de instituciones × años a partir de la
          distribución que mejor ajusta las tasas reales de deserción
          2010–2024. La semilla fija el resultado: misma semilla, mismo panel.
        </p>
      </header>
      <Simulador />
      <footer className="pie">
        Parámetros estimados por máxima verosimilitud sobre cortes transversales
        anuales de IES colombianas (SPADIES). Probadas año por año, la log-Laplace
        no se rechaza en 12 de los 15 años (p mediano 0,150); la log-logística, en
        5; la lognormal, en ninguno. Todas las cifras son por institución, nunca
        por estudiante: el archivo no trae matrículas.
      </footer>
    </main>
  );
}
