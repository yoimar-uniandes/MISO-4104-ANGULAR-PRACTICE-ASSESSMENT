import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { RepositoryCard } from '@shared/ui/repository-card/repository-card';
import { Repositories } from '@features/repositories/repositories';
import { Users } from './users';
import type { Role, User } from './user';

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
const AVATAR_MAX_TILT_DEG = 14;
const AVATAR_MAX_SCALE = 1.18;
const AVATAR_MIN_SCALE = 1.06;

@Component({
  selector: 'app-user-detail-page',
  imports: [RouterLink, RepositoryCard],
  templateUrl: './user-detail-page.html',
  styleUrl: './user-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserDetailPage {
  /** Bound from the route param `:id` thanks to `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  private readonly usersService = inject(Users);
  private readonly reposService = inject(Repositories);

  protected readonly avatarFailed = signal(false);
  protected readonly tilt = signal<AvatarTilt>(AVATAR_REST);

  /* ── Rail "Otros developers": control programático con flechas ─────── */
  private readonly railEl = viewChild<ElementRef<HTMLElement>>('railEl');
  protected readonly canScrollPrev = signal(false);
  protected readonly canScrollNext = signal(false);

  constructor() {
    /* Inicializa el estado de las flechas tras el primer render del rail. */
    afterNextRender(() => {
      this.recomputeRailState();
    });
  }

  protected onRailScroll(): void {
    this.recomputeRailState();
  }

  protected scrollRailPrev(): void {
    this.scrollRail(-1);
  }

  protected scrollRailNext(): void {
    this.scrollRail(1);
  }

  private scrollRail(direction: -1 | 1): void {
    const el = this.railEl()?.nativeElement;
    if (!el) return;
    /* Avanzamos ~80% del viewport del rail para mostrar contenido nuevo
       conservando una card de contexto en el borde. */
    const delta = el.clientWidth * 0.8 * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  private recomputeRailState(): void {
    const el = this.railEl()?.nativeElement;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    this.canScrollPrev.set(el.scrollLeft > 0);
    /* `-1` para tolerar redondeo subpixel. */
    this.canScrollNext.set(max > 0 && el.scrollLeft < max - 1);
  }

  private readonly allUsers = toSignal(this.usersService.list(), { initialValue: undefined });
  private readonly allRepos = toSignal(this.reposService.list(), { initialValue: undefined });

  protected readonly isLoading = computed(
    () => this.allUsers() === undefined || this.allRepos() === undefined,
  );

  protected readonly user = computed<User | undefined>(() => {
    const list = this.allUsers();
    if (!list) return undefined;
    const numeric = Number(this.id());
    return list.find((u) => u.id === numeric);
  });

  protected readonly notFound = computed(
    () => this.allUsers() !== undefined && this.user() === undefined,
  );

  protected readonly userRepos = computed(() => {
    const list = this.allRepos();
    const u = this.user();
    if (!list || !u) return [];
    return list.filter((r) => u.ownsRepo(r.id));
  });

  protected readonly otherUsers = computed<readonly User[]>(() => {
    const list = this.allUsers();
    const u = this.user();
    if (!list || !u) return [];
    return list.filter((other) => other.id !== u.id);
  });

  protected readonly mapsUrl = computed(() => {
    const u = this.user();
    if (!u) return '#';
    const query = encodeURIComponent(`${u.location}, Colombia`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  });

  protected readonly roleLabel = computed(() => {
    const u = this.user();
    return u ? ROLE_LABEL[u.role] : '';
  });

  protected readonly initials = computed(() => {
    const u = this.user();
    if (!u) return '?';
    const parts = u.name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase() || '?';
  });

  protected readonly reposLabel = computed(() => {
    const u = this.user();
    if (!u) return '';
    const n = u.repoIds.length;
    if (n === 0) return 'Sin repositorios';
    if (n === 1) return '1 repositorio';
    return `${String(n)} repositorios`;
  });

  protected roleOf(other: User): string {
    return ROLE_LABEL[other.role];
  }

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

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
