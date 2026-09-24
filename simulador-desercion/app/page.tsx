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
        Parámetros estimados por máxima verosimilitud sobre 289 IES colombianas
        (SPADIES, 3.930 observaciones institución-año). La log-logística encabeza
        el ranking por AIC entre 13 familias y no es rechazada por Anderson–Darling
        (p = 0,140); la lognormal, con los mismos dos parámetros, sí lo es
        (p = 0,006).
      </footer>
    </main>
  );
}
