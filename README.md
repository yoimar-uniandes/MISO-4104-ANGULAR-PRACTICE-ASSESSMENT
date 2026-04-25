# MISO-4104 — Angular Practice Assessment

Aplicación Angular 21 con SSR usada como práctica para el curso **MISO-4104 Arquitectura
Empresarial Web** de la Maestría en Ingeniería de Software (Universidad de los Andes).

## Stack

| Capa           | Herramienta                                                 |
| -------------- | ----------------------------------------------------------- |
| Framework      | Angular **21.2** (standalone, signals, control flow)        |
| Renderizado    | SSR + hydration (`@angular/ssr`, Express 5)                 |
| Estilos        | CSS puro (variables CSS, BEM, sin frameworks)               |
| Lenguaje       | TypeScript 5.9 (modo estricto + `noUncheckedIndexedAccess`) |
| Tests          | Vitest 4 + jsdom (`@angular/build:unit-test`)               |
| Lint / formato | ESLint 10 (flat config) + angular-eslint 21 + Prettier 3    |
| Runtime        | Node ≥ 22.12.0, npm 11.12.1                                 |

## Requisitos

- Node `>= 22.12.0`
- npm `11.12.1` (definido en `engines` y `packageManager` del `package.json`)

## Puesta en marcha

```bash
npm install
npm start          # http://localhost:4200
```

## Scripts disponibles

| Comando                 | Descripción                              |
| ----------------------- | ---------------------------------------- |
| `npm start`             | Servidor de desarrollo (Angular CLI)     |
| `npm run build`         | Build de producción (modo SSR)           |
| `npm run watch`         | Build incremental en modo desarrollo     |
| `npm test`              | Ejecuta la suite con Vitest (single run) |
| `npm run test:watch`    | Vitest en modo watch                     |
| `npm run test:coverage` | Vitest con cobertura (80/70/80/80)       |
| `npm run test:ui`       | UI interactiva de Vitest                 |
| `npm run lint`          | ESLint sobre todo el repo                |
| `npm run lint:fix`      | ESLint con autofix                       |
| `npm run format`        | Prettier write                           |
| `npm run format:check`  | Prettier check (lo que corre en CI)      |
| `npm run typecheck`     | `tsc --build --force`                    |
| `npm run serve:ssr:*`   | Sirve el bundle SSR ya construido        |

## Estructura del proyecto

```
src/
├── app/
│   ├── core/                 # Servicios singleton, guards, interceptors, providers
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── providers/
│   │       └── global-error-handler.ts
│   ├── features/             # Features de dominio (lazy-loaded)
│   │   └── home/
│   ├── layouts/              # Shells de UI
│   │   └── main/
│   ├── shared/               # UI reutilizable, pipes, directivas, utils
│   │   ├── directives/
│   │   ├── pipes/
│   │   ├── ui/
│   │   └── utils/
│   ├── app.config.ts         # Providers de la app (HttpClient, Router, Hydration, ErrorHandler)
│   ├── app.config.server.ts  # Config específica de SSR
│   ├── app.routes.ts         # Rutas del cliente
│   ├── app.routes.server.ts  # Render mode por ruta (SSR)
│   ├── app.html              # Template raíz (sólo `<router-outlet />`)
│   └── app.ts                # Componente raíz
├── environments/             # environment.ts / environment.development.ts
├── main.ts                   # Bootstrap del navegador
├── main.server.ts            # Bootstrap del servidor
├── server.ts                 # Servidor Express SSR
├── setup-tests.ts            # Bootstrap de Vitest
└── test-providers.ts         # Providers globales para tests
```

### Path aliases

| Alias         | Apunta a             |
| ------------- | -------------------- |
| `@app/*`      | `src/app/*`          |
| `@core/*`     | `src/app/core/*`     |
| `@shared/*`   | `src/app/shared/*`   |
| `@features/*` | `src/app/features/*` |
| `@layouts/*`  | `src/app/layouts/*`  |
| `@env/*`      | `src/environments/*` |

## Convenciones

- **Standalone** siempre (`strictStandalone: true`). Nada de `NgModule`.
- Componentes con `ChangeDetectionStrategy.OnPush` y **signals** para estado local.
- Nuevo _control flow_ (`@if`, `@for`, `@switch`) — el viejo `*ngIf`/`*ngFor` está vetado por lint.
- Sin sufijo `Component`/`Directive` (alineado con la guía Angular 20+).
- Sin `any` (`@typescript-eslint/no-explicit-any: error`).
- Lazy loading por feature con `loadComponent` / `loadChildren`.
- Cobertura mínima: **80% statements / 70% branches / 80% functions / 80% lines**.

## SSR

- `provideClientHydration(withEventReplay())` activa hydration con replay de eventos.
- `app.routes.server.ts` define el `RenderMode` por ruta (por defecto `Server`, cambiar a
  `Prerender` cuando la ruta sea estática).
- Los assets se sirven desde `/browser` con `Cache-Control: max-age=1y`.

## CI

Workflow en `.github/workflows/ci.yml` — corre en `push` y `pull_request` a `main`:

1. `npm ci`
2. `format:check`
3. `lint`
4. `typecheck`
5. `test:coverage` (artefacto subido a GitHub)
6. `build`

## Docker

El proyecto incluye un `Dockerfile` multi-stage en la raíz y dos compose files
separados por entorno bajo `environment/`.

```
environment/
  development/
    .env                # NODE_ENV, PORT, polling para WSL2/Docker
    docker-compose.yml  # bind mount del repo → hot reload con `ng serve`
  production/
    .env                # NODE_ENV, PORT
    docker-compose.yml  # imagen mínima, read-only, healthcheck, recursos limitados
Dockerfile              # base → development → deps → builder → production
.dockerignore
```

### Stages del Dockerfile

| Stage         | Para qué sirve                                                       |
| ------------- | -------------------------------------------------------------------- |
| `base`        | `node:22-alpine` con env de npm sano                                 |
| `development` | devDependencies + `ng serve` (target del compose dev)                |
| `deps`        | `npm ci` con todas las deps para el build                            |
| `builder`     | `npm run build` (genera `dist/.../server.mjs` self-contained)        |
| `production`  | Sólo `node:22-alpine` + `dist/`, usuario `node`, healthcheck, no npm |

La imagen final no incluye `node_modules`, `package.json` ni código fuente —
únicamente el bundle SSR generado por esbuild (que ya inlinea Express y
dependencias de runtime).

### Desarrollo

```bash
cd environment/development
docker compose up --build
# http://localhost:4200 — los cambios en src/ se reflejan al instante.
```

El `bind mount` (`../..:/app`) mapea el código fuente del host al contenedor; el
volumen anónimo sobre `/app/node_modules` evita que el host pise las deps
instaladas dentro de la imagen. El polling (`--poll 1000` + `CHOKIDAR_USEPOLLING`)
es necesario en WSL2 / Docker Desktop para que el watcher detecte cambios.

### Producción

```bash
cd environment/production
docker compose up --build -d
# http://localhost:4000
```

Hardening incluido en `production/docker-compose.yml`:

- `read_only: true` con `tmpfs: /tmp`
- `cap_drop: [ALL]`, `no-new-privileges`
- Límites de CPU/memoria (1 CPU, 512 MiB)
- Healthcheck via `fetch` interno
- Logs rotados (10 MB × 3 archivos)

## Plantillas de issue / PR

- `.github/ISSUE_TEMPLATE/hu.yml` — Historia de Usuario
- `.github/ISSUE_TEMPLATE/tarea.yml` — Tarea derivada de una HU
- `.github/ISSUE_TEMPLATE/bug.yml` — Reporte de bug
- `.github/pull_request_template.md` — Checklist de PR

## Licencia

Uso académico — MISO-4104, Universidad de los Andes.
