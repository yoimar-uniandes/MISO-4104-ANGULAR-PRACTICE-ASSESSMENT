import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from '@shared/ui/navbar/navbar';

@Component({
  selector: 'app-main-layout',
  imports: [Navbar, RouterOutlet],
  templateUrl: './main-layout.html',
  styleUrl: './main-layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayout {
  protected readonly year = new Date().getFullYear();
}
