import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { Role, User } from '@features/users/user';

const ROLE_LABEL: Readonly<Record<Role, string>> = {
  admin: 'Admin',
  developer: 'Developer',
  designer: 'Designer',
};

interface AvatarTilt {
  readonly x: number;
  readonly y: number;
  readonly scale: number;
}

const AVATAR_REST: AvatarTilt = { x: 0, y: 0, scale: 1 };
const AVATAR_MAX_TILT_DEG = 18;
const AVATAR_MAX_SCALE = 1.286;
const AVATAR_MIN_SCALE = 1.104;

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCard {
  readonly user = input.required<User>();

  protected readonly avatarFailed = signal(false);
  protected readonly tilt = signal<AvatarTilt>(AVATAR_REST);

  protected readonly initials = computed(() => {
    const parts = this.user().name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase() || '?';
  });

  protected readonly roleLabel = computed(() => ROLE_LABEL[this.user().role]);

  protected readonly mapsUrl = computed(() => {
    const query = encodeURIComponent(`${this.user().location}, Colombia`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  });

  protected readonly repoLabel = computed(() => {
    const n = this.user().repoIds.length;
    if (n === 0) return 'Sin repositorios';
    if (n === 1) return '1 repositorio';
    return `${String(n)} repositorios`;
  });

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

  /**
   * Calcula tilt + escala del avatar a partir de la posición del cursor:
   * el avatar "mira" hacia donde apunta el cursor (rotateX/rotateY) y crece
   * cuando el cursor se acerca al centro, encogiéndose hacia los bordes.
   */
  protected onAvatarMove(event: MouseEvent): void {
    const stage = event.currentTarget as HTMLElement;
    const rect = stage.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const nx = (event.clientX - cx) / (rect.width / 2);
    const ny = (event.clientY - cy) / (rect.height / 2);
    const dist = Math.min(1, Math.hypot(nx, ny));
    const scale = AVATAR_MAX_SCALE - (AVATAR_MAX_SCALE - AVATAR_MIN_SCALE) * dist;
    this.tilt.set({
      x: -ny * AVATAR_MAX_TILT_DEG,
      y: nx * AVATAR_MAX_TILT_DEG,
      scale,
    });
  }

  protected onAvatarLeave(): void {
    this.tilt.set(AVATAR_REST);
  }
}
