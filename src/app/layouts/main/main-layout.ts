import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '@shared/ui/navbar/navbar';
import { Footer } from '@shared/ui/footer/footer';

@Component({
  selector: 'app-main-layout',
  imports: [Navbar, Footer, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  /** Id del `<main>` para futuros skip-to-content / focus management. */
  protected readonly mainId = 'main-content';
}
