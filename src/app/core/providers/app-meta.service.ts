import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '@env/environment';

export interface PageMeta {
  /** Título completo ya prefijado (ej. "GhQuerry - Inicio"). */
  readonly title: string;
  /** Descripción <= 160 caracteres recomendado para SEO + previews. */
  readonly description: string;
  /** Path absoluto desde la raíz del sitio (ej. "/usuarios"). */
  readonly url: string;
  /** Path relativo al `siteUrl` (ej. "/favicon.png"); `undefined` usa el default. */
  readonly imagePath?: string | undefined;
  /** Texto descriptivo de la imagen; `undefined` usa el default. */
  readonly imageAlt?: string | undefined;
}

/**
 * Centraliza la actualización de meta tags estándar + Open Graph + Twitter
 * Cards. Se llama desde {@link AppTitleStrategy} en cada cambio de ruta.
 *
 * Las preview de WhatsApp / Telegram / LinkedIn / Facebook usan Open Graph;
 * Twitter (X) usa Twitter Cards (con fallback a OG). Aquí se setean ambos.
 */
@Injectable({ providedIn: 'root' })
export class AppMeta {
  private static readonly defaultImage = '/favicon.png';
  private static readonly defaultImageAlt = 'GhQuerry';

  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  set(page: PageMeta): void {
    this.title.setTitle(page.title);

    const absoluteUrl = `${environment.siteUrl}${page.url}`;
    const absoluteImage = `${environment.siteUrl}${page.imagePath ?? AppMeta.defaultImage}`;
    const imageAlt = page.imageAlt ?? AppMeta.defaultImageAlt;

    /* SEO clásico */
    this.upsert('name', 'description', page.description);

    /* Open Graph (WhatsApp, LinkedIn, Telegram, Facebook) */
    this.upsert('property', 'og:title', page.title);
    this.upsert('property', 'og:description', page.description);
    this.upsert('property', 'og:url', absoluteUrl);
    this.upsert('property', 'og:image', absoluteImage);
    this.upsert('property', 'og:image:alt', imageAlt);

    /* Twitter Cards (X) */
    this.upsert('name', 'twitter:title', page.title);
    this.upsert('name', 'twitter:description', page.description);
    this.upsert('name', 'twitter:image', absoluteImage);
    this.upsert('name', 'twitter:image:alt', imageAlt);

    /* Canonical link (helps search engines deduplicate) */
    this.upsertCanonical(absoluteUrl);
  }

  /** Crea o actualiza un `<meta>` por su atributo identificador. */
  private upsert(attr: 'name' | 'property', key: string, content: string): void {
    const selector = `${attr}="${key}"`;
    if (this.meta.getTag(selector)) {
      this.meta.updateTag({ [attr]: key, content }, selector);
    } else {
      this.meta.addTag({ [attr]: key, content });
    }
  }

  /** Crea o actualiza el `<link rel="canonical">` en `<head>`. */
  private upsertCanonical(href: string): void {
    if (typeof document === 'undefined') {
      return;
    }
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = href;
  }
}
