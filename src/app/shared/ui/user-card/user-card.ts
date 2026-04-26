import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import type { Role, User } from '@features/users/user';

const ROLE_LABEL: Readonly<Record<Role, string>> = {
  admin: 'Administrador',
  developer: 'Developer',
  designer: 'Designer',
};

@Component({
  selector: 'app-user-card',
  templateUrl: './user-card.html',
  styleUrl: './user-card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserCard {
  readonly user = input.required<User>();

  protected readonly avatarFailed = signal(false);

  protected readonly initials = computed(() => {
    const parts = this.user().name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase() || '?';
  });

  protected readonly roleLabel = computed(() => ROLE_LABEL[this.user().role]);

  protected readonly repoLabel = computed(() => {
    const n = this.user().repoIds.length;
    if (n === 0) return 'Sin repositorios';
    if (n === 1) return '1 repositorio';
    return `${String(n)} repositorios`;
  });

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }
}
