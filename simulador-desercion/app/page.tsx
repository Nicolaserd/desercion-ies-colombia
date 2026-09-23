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
        (SPADIES, 3.930 observaciones institución-año). La log-logística es la
        única familia de 2 parámetros que el contraste de Anderson–Darling no
        rechaza.
      </footer>
    </main>
  );
}
