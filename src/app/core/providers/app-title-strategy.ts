import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { type RouterStateSnapshot, TitleStrategy } from '@angular/router';

/**
 * Antepone "GhQuerry - " al `title` declarado en cada ruta.
 * Si una ruta no define `title`, se usa solo "GhQuerry".
 */
@Injectable({ providedIn: 'root' })
export class AppTitleStrategy extends TitleStrategy {
  private static readonly siteName = 'GhQuerry';

  private readonly titleService = inject(Title);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const routeTitle = this.buildTitle(snapshot);
    const fullTitle = routeTitle
      ? `${AppTitleStrategy.siteName} - ${routeTitle}`
      : AppTitleStrategy.siteName;
    this.titleService.setTitle(fullTitle);
  }
}
