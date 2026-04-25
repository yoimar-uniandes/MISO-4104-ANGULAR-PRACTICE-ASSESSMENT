import { RenderMode, type ServerRoute } from '@angular/ssr';

/**
 * Prerender para todas las rutas → genera HTML estático en build time.
 * Compatible con outputMode:'static' (gh-pages) y outputMode:'server' (SSR
 * que sirve el HTML pre-generado).
 *
 * Las llamadas HttpClient (`Users.list()`, `Repositories.list()`) se
 * ejecutan durante el prerender; los datos se embeben en el HTML vía
 * TransferState — el navegador hidrata sin volver a fetchear.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
