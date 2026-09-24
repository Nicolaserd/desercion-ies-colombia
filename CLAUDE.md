# Reglas del proyecto

## Gestor de paquetes: pnpm, nunca npm ni yarn

Todo se instala y ejecuta con **pnpm**. Está fijado en `package.json` mediante el
campo `packageManager`, así que Corepack activa la versión correcta solo.

```bash
corepack enable
pnpm install
pnpm run verify      # typecheck + lint + build
pnpm audit --audit-level moderate
```

Si aparece un `package-lock.json` o un `yarn.lock`, es un error: bórrese y
reinstálese con pnpm. El único lockfile válido es `pnpm-lock.yaml`, y va
versionado.

**Por qué pnpm y no npm.** Además del ahorro de disco, pnpm no ejecuta los
scripts de instalación de las dependencias salvo autorización explícita. npm los
ejecuta en silencio, y son el principal vector de ataque de cadena de suministro:
un paquete comprometido corre código arbitrario con solo instalarse.

## Scripts de instalación: denegados por omisión

La decisión vive en `pnpm-workspace.yaml`, bajo `allowBuilds`. Hoy:

```yaml
allowBuilds:
  unrs-resolver: false
```

Para cambiarla se usa el comando, no el editor:

```bash
pnpm approve-builds "!nombre-del-paquete"   # denegar
pnpm approve-builds "nombre-del-paquete"    # permitir
```

Antes de permitir uno hay que comprobar que de verdad hace falta: `pnpm run
verify` debe fallar sin él. Se permite el paquete concreto, nunca la lista
entera, y se documenta el motivo en el propio archivo.

## Versiones: la última estable, nunca la beta ni la RC

Aplica a Node, pnpm, Next, React y Python. Antes de fijar una versión hay que
comprobar cuál es la última publicada como estable:

```bash
pnpm view next version
pnpm view react version
```

No se usan `beta`, `rc`, `canary` ni `next`. Las versiones de producción van
**fijadas exactas** en `dependencies` (sin `^` ni `~`), para que el lockfile y el
manifiesto no puedan divergir.

Estado al día de hoy:

| Herramienta | En uso | Última estable | Nota |
|---|---|---|---|
| Node | 24.14.0 | 24.x | LTS activa |
| pnpm | 12.6.0 | 12.6.0 | fijada con `packageManager` |
| Next.js | 16.3.6 | 16.3.6 | al día |
| React | 19.3.0 | 19.3.0 | al día |
| Python | 3.11.9 | 3.14.x | **desactualizado**, ver abajo |

## Python

El análisis corre sobre Python **3.11.9**, que ya no es la rama estable actual.
La 3.11 sigue recibiendo parches de seguridad, pero no correcciones de fallos, y
3.11.9 no es siquiera el último parche de su propia rama.

Regla: usar la **última rama estable** de Python y su último parche. Actualizar
el intérprete es un cambio del sistema, fuera del alcance de este repositorio, y
debe hacerlo la persona usuaria:

```powershell
winget install --id Python.Python.3.14
```

Tras actualizar hay que reinstalar las dependencias del análisis y reejecutar el
cuaderno completo, porque las salidas van incrustadas en el `.ipynb`:

```bash
pip install --upgrade pandas numpy scipy matplotlib seaborn openpyxl jupyter
jupyter nbconvert --to notebook --execute --inplace DISPERSION_DESERCION.ipynb
```

## Next.js

`AGENTS.md` dentro de `simulador-desercion/` advierte que esta versión tiene
cambios de ruptura respecto a lo que un modelo de lenguaje suele conocer. La
documentación exacta de la versión instalada viene con el paquete:

```
simulador-desercion/node_modules/next/dist/docs/
```

**Hay que leerla antes de escribir código de Next**, no confiar en la memoria.
Ejemplo real de esta diferencia: el layout raíz usa el tipo global
`LayoutProps<"/">`, que no existía en versiones anteriores.

## Verificación antes de cada commit

```bash
cd simulador-desercion && pnpm run verify && pnpm audit --audit-level moderate
```

Los tres pasos —tipos, lint y build— deben salir en 0, y la auditoría sin
vulnerabilidades conocidas. Un aviso no se silencia: se entiende y se corrige, o
se documenta por qué se acepta.

## El cuaderno se commitea con sus salidas

`DISPERSION_DESERCION.ipynb` pesa ~1,8 MB porque lleva las figuras incrustadas.
Es deliberado: así se lee en GitHub sin ejecutarlo. Nunca se commitea el cuaderno
sin ejecutar —pesa ~0,12 MB y en GitHub se ve como código sin ningún resultado—.
Verifíquese el tamaño antes de commitear.

## Rigor del análisis

Toda afirmación numérica en el cuaderno, el README o la interfaz debe salir de
una celda ejecutada. Si una cifra escrita contradice la salida, manda la salida.
Ya ocurrió tres veces en este repositorio: el ganador de la distribución, el
`xmin` de la ley de potencias y la atenuación de la cópula.
