import { RenderMode, type ServerRoute } from '@angular/ssr';
import { environment } from '@env/environment';

/**
 * Prerender para todas las rutas → genera HTML estático en build time.
 * Compatible con outputMode:'static' (gh-pages) y outputMode:'server' (SSR
 * que sirve el HTML pre-generado).
 *
 * Las llamadas HttpClient (`Users.list()`, `Repositories.list()`) se
 * ejecutan durante el prerender; los datos se embeben en el HTML vía
 * TransferState — el navegador hidrata sin volver a fetchear.
 *
 * Para rutas dinámicas (`:id`) Angular SSR exige `getPrerenderParams`
 * que devuelva la lista de valores a materializar — fetcheamos el JSON
 * de usuarios para enumerar todos los ids.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: 'usuarios/:id',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: async () => {
      const response = await fetch(environment.apis.users);
      if (!response.ok) {
        throw new Error('Failed to fetch users for prerender: HTTP ' + String(response.status));
      }
      const users = (await response.json()) as ReadonlyArray<{ id: number }>;
      return users.map((u) => ({ id: String(u.id) }));
    },
  },
  {
    path: '**',
    renderMode: RenderMode.Prerender,
  },
];
