import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BackgroundGraph } from '@shared/ui/background-graph/background-graph';

@Component({
  selector: 'app-home',
  imports: [RouterLink, BackgroundGraph],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly siteName = 'GhQuerry';

  /** Inclinación del logo en grados (X = vertical, Y = horizontal). */
  protected readonly tiltX = signal(0);
  protected readonly tiltY = signal(0);

  /** Rango máximo de inclinación. */
  private static readonly maxTilt = 18;

  onLogoMouseMove(event: MouseEvent): void {
    const stage = event.currentTarget as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    /* Posición del cursor relativa al centro, normalizada a [-1, 1] */
    const nx = (event.clientX - cx) / (rect.width / 2);
    const ny = (event.clientY - cy) / (rect.height / 2);
    /* Inclinamos hacia el cursor: arriba/derecha se "asoman" hacia la cámara */
    this.tiltX.set(-ny * Home.maxTilt);
    this.tiltY.set(nx * Home.maxTilt);
  }

  onLogoMouseLeave(): void {
    this.tiltX.set(0);
    this.tiltY.set(0);
  }
}
