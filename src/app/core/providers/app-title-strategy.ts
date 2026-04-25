import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  type ActivatedRouteSnapshot,
  type RouterStateSnapshot,
  TitleStrategy,
} from '@angular/router';

import { AppMeta } from './app-meta.service';

/**
 * Estrategia personalizada que en cada cambio de ruta:
 *   1. Antepone "GhQuerry - " al `title` declarado en la ruta.
 *   2. Lee `data.description` y `data.ogImage` de la ruta hoja activa y
 *      delega a `AppMeta` la actualización de meta description, Open Graph
 *      y Twitter Cards.
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private static readonly siteName = 'GhQuerry';
  private static readonly fallbackDescription =
    'Plataforma académica para explorar developers y repositorios de GitHub. ' +
    'GhQuerry, un proyecto del curso MISO-4104 de la Universidad de los Andes.';

  private readonly titleService = inject(Title);
  private readonly metaService = inject(AppMeta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const fullTitle = routeTitle
      ? `${AppTitleStrategy.siteName} - ${routeTitle}`
      : AppTitleStrategy.siteName;
    this.titleService.setTitle(fullTitle);

    const leaf = AppTitleStrategy.findLeaf(snapshot.root);
    const description =
      (leaf.data['description'] as string | undefined) ?? AppTitleStrategy.fallbackDescription;
    const imagePath = leaf.data['ogImage'] as string | undefined;
    const imageAlt = leaf.data['ogImageAlt'] as string | undefined;

    this.metaService.set({
      title: fullTitle,
      description,
      url: snapshot.url || '/',
      imagePath,
      imageAlt,
    });
  }

  /** Devuelve el snapshot de la ruta hoja (más profunda en la jerarquía). */
  private static findLeaf(node: ActivatedRouteSnapshot): ActivatedRouteSnapshot {
    let current = node;
    while (current.firstChild) {
      current = current.firstChild;
    }
    return current;
  }
}
