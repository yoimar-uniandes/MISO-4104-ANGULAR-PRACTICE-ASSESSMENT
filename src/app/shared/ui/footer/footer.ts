import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

interface FooterLink {
  readonly label: string;
  readonly path: string;
}

interface FooterExternalLink {
  readonly label: string;
  readonly href: string;
}

interface FooterColumn<T> {
  readonly title: string;
  readonly items: readonly T[];
}

@Component({
  selector: 'app-footer',
  imports: [RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly siteName = 'GhQuerry';
  protected readonly tagline = 'Explora usuarios y repositorios desde una plataforma académica.';
  protected readonly logoSrc = 'footer_logo.png';
  protected readonly year = new Date().getFullYear();

  protected readonly internal: FooterColumn<FooterLink> = {
    title: 'Navegación',
    items: [
      { label: 'Inicio', path: '/' },
      { label: 'Usuarios', path: '/usuarios' },
      { label: 'Repositorios', path: '/repositorios' },
    ],
  };

  protected readonly external: FooterColumn<FooterExternalLink> = {
    title: 'Recursos',
    items: [
      { label: 'Universidad de los Andes', href: 'https://uniandes.edu.co' },
      {
        label: 'MISO — Maestría en Ingeniería de Software',
        href: 'https://sistemas.uniandes.edu.co/maestrias/miso/virtual/',
      },
      { label: 'Angular', href: 'https://angular.dev' },
    ],
  };
}
