<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Reglas de este proyecto

Las reglas completas están en [`../CLAUDE.md`](../CLAUDE.md). Lo esencial:

- **pnpm, nunca npm ni yarn.** La versión está fijada en `packageManager`;
  `corepack enable` la activa. El único lockfile válido es `pnpm-lock.yaml`.
- **Los scripts de instalación están denegados por omisión** en
  `pnpm-workspace.yaml`, bajo `allowBuilds`. Para cambiarlo se usa
  `pnpm approve-builds`, no el editor, y se permite el paquete concreto tras
  comprobar que `pnpm run verify` falla sin él.
- **Última versión estable, nunca beta, rc ni canary.** Las dependencias de
  producción van fijadas exactas, sin `^` ni `~`.
- **Antes de commitear:** `pnpm run verify && pnpm audit --audit-level moderate`.
  Un aviso no se silencia: se entiende y se corrige, o se documenta por qué se
  acepta.
