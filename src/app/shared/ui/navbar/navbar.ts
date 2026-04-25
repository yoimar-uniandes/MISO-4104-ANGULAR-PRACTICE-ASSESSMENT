import { ChangeDetectionStrategy, Component, HostListener, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

interface NavLink {
  readonly path: string;
  readonly label: string;
  readonly exact: boolean;
}

@Component({
  selector: 'app-navbar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Navbar {
  protected readonly isMenuOpen = signal(false);

  protected readonly siteName = 'GhQuerry';
  protected readonly logoSrc = 'favicon.png';

  protected readonly links: readonly NavLink[] = [
    { path: '/', label: 'Inicio', exact: true },
    { path: '/usuarios', label: 'Usuarios', exact: false },
    { path: '/repositorios', label: 'Repositorios', exact: false },
  ];

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.isMenuOpen.set(false);
  }

  @HostListener('window:resize')
  onResize(): void {
    if (typeof window !== 'undefined' && window.innerWidth >= 768 && this.isMenuOpen()) {
      this.isMenuOpen.set(false);
    }
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isMenuOpen()) {
      this.isMenuOpen.set(false);
    }
  }
}
