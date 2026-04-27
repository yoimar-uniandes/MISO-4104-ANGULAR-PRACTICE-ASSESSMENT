import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { Repository } from '@features/repositories/repository';
import type { User } from '@features/users/user';

/**
 * Paleta canónica de colores de lenguaje (estilo GitHub linguist) usada para
 * teñir el badge de identidad y el dot del chip.
 */
const LANGUAGE_COLOR: Readonly<Record<string, string>> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572a5',
  Java: '#b07219',
  Go: '#00add8',
  Rust: '#dea584',
  'C#': '#178600',
  'C++': '#f34b7d',
  Ruby: '#701516',
  Swift: '#f05138',
  Kotlin: '#a97bff',
  HTML: '#e34c26',
  CSS: '#563d7c',
  Shell: '#89e051',
  YAML: '#cb171e',
};

const FALLBACK_LANGUAGE_COLOR = '#73726d';

const DATE_FORMATTER = new Intl.DateTimeFormat('es-CO', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

interface BadgeTilt {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

const BADGE_REST: BadgeTilt = { x: 0, y: 0, scale: 1 };
const BADGE_MAX_TILT_DEG = 18;
const BADGE_MAX_SCALE = 1.286;
const BADGE_MIN_SCALE = 1.104;

@Component({
  selector: 'app-repository-card',
  imports: [RouterLink],
  templateUrl: './repository-card.html',
  styleUrl: './repository-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoryCard {
  readonly repository = input.required<Repository>();
  readonly owner = input<User | null>(null);

  protected readonly avatarFailed = signal(false);
  protected readonly tilt = signal<BadgeTilt>(BADGE_REST);

  protected readonly languageColor = computed(
    () => LANGUAGE_COLOR[this.repository().language] ?? FALLBACK_LANGUAGE_COLOR,
  );

  protected readonly createdAtLabel = computed(() =>
    DATE_FORMATTER.format(this.repository().createdAtDate),
  );

  protected readonly starsLabel = computed(() => {
    const n = this.repository().stars;
    if (n === 1) return '1 estrellita';
    return `${String(n)} estrellitas`;
  });

  /**
   * Tier de popularidad para colorear el badge de estrellas. Los umbrales
   * están alineados con la distribución del dataset (15–140, media 66).
   */
  protected readonly starsTier = computed<'low' | 'mid' | 'high' | 'top'>(() => {
    const n = this.repository().stars;
    if (n >= 120) return 'top';
    if (n >= 80) return 'high';
    if (n >= 40) return 'mid';
    return 'low';
  });

  protected readonly ownerInitials = computed(() => {
    const o = this.owner();
    if (!o) return '?';
    const parts = o.name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase() || '?';
  });

  protected onOwnerAvatarError(): void {
    this.avatarFailed.set(true);
  }

  /**
   * Tilt 3D + escala dinámica del badge de lenguaje, en paralelo al efecto
   * del avatar de UserCard: el badge "mira" hacia donde apunta el cursor y
   * crece más cuando el cursor pasa por el centro.
   */
  protected onBadgeMove(event: MouseEvent): void {
    const stage = event.currentTarget as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (event.clientX - cx) / (rect.width / 2);
    const ny = (event.clientY - cy) / (rect.height / 2);
    const dist = Math.min(1, Math.hypot(nx, ny));
    const scale = BADGE_MAX_SCALE - (BADGE_MAX_SCALE - BADGE_MIN_SCALE) * dist;
    this.tilt.set({
      x: -ny * BADGE_MAX_TILT_DEG,
      y: nx * BADGE_MAX_TILT_DEG,
      scale,
    });
  }

  protected onBadgeLeave(): void {
    this.tilt.set(BADGE_REST);
  }
}
