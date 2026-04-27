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

import { Users } from '@features/users';
import type { User } from '@features/users/user';
import { Repositories } from './repositories';
import type { Repository } from './repository';

/**
 * Paleta canónica de colores de lenguaje (alineada con `RepositoryCard`).
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
const BADGE_MAX_TILT_DEG = 14;
const BADGE_MAX_SCALE = 1.18;
const BADGE_MIN_SCALE = 1.06;

type StarsTier = 'low' | 'mid' | 'high' | 'top';

function tierForStars(stars: number): StarsTier {
  if (stars >= 120) return 'top';
  if (stars >= 80) return 'high';
  if (stars >= 40) return 'mid';
  return 'low';
}

@Component({
  selector: 'app-repository-detail-page',
  imports: [RouterLink],
  templateUrl: './repository-detail-page.html',
  styleUrl: './repository-detail-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoryDetailPage {
  /** Bound from the route param `:id` thanks to `withComponentInputBinding()`. */
  readonly id = input.required<string>();

  private readonly reposService = inject(Repositories);
  private readonly usersService = inject(Users);

  protected readonly avatarFailed = signal(false);
  protected readonly tilt = signal<BadgeTilt>(BADGE_REST);

  private readonly allRepos = toSignal(this.reposService.list(), { initialValue: undefined });
  private readonly allUsers = toSignal(this.usersService.list(), { initialValue: undefined });

  protected readonly isLoading = computed(
    () => this.allRepos() === undefined || this.allUsers() === undefined,
  );

  protected readonly repository = computed<Repository | undefined>(() => {
    const list = this.allRepos();
    if (!list) return undefined;
    const numeric = Number(this.id());
    return list.find((r) => r.id === numeric);
  });

  protected readonly notFound = computed(
    () => this.allRepos() !== undefined && this.repository() === undefined,
  );

  protected readonly owner = computed<User | null>(() => {
    const r = this.repository();
    const list = this.allUsers();
    if (!r || !list) return null;
    return list.find((u) => u.id === r.ownerId) ?? null;
  });

  protected readonly otherReposBySameOwner = computed<readonly Repository[]>(() => {
    const list = this.allRepos();
    const r = this.repository();
    if (!list || !r) return [];
    return list.filter((other) => other.id !== r.id && other.ownerId === r.ownerId);
  });

  protected readonly similarByLanguage = computed<readonly Repository[]>(() => {
    const list = this.allRepos();
    const r = this.repository();
    if (!list || !r) return [];
    return list.filter((other) => other.id !== r.id && other.language === r.language);
  });

  protected readonly languageColor = computed(() => {
    const r = this.repository();
    if (!r) return FALLBACK_LANGUAGE_COLOR;
    return LANGUAGE_COLOR[r.language] ?? FALLBACK_LANGUAGE_COLOR;
  });

  protected readonly createdAtLabel = computed(() => {
    const r = this.repository();
    return r ? DATE_FORMATTER.format(r.createdAtDate) : '';
  });

  protected readonly starsLabel = computed(() => {
    const r = this.repository();
    if (!r) return '';
    const n = r.stars;
    if (n === 1) return '1 estrellita';
    return `${String(n)} estrellitas`;
  });

  protected readonly starsTier = computed<StarsTier>(() => {
    const r = this.repository();
    if (!r) return 'low';
    return tierForStars(r.stars);
  });

  protected readonly ownerInitials = computed(() => {
    const o = this.owner();
    if (!o) return '?';
    const parts = o.name.trim().split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] ?? '';
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
    return (first + last).toUpperCase() || '?';
  });

  /* ── Rails: control programático con flechas ───────────────────────── */
  private readonly ownerRailEl = viewChild<ElementRef<HTMLElement>>('ownerRailEl');
  private readonly langRailEl = viewChild<ElementRef<HTMLElement>>('langRailEl');

  protected readonly canScrollOwnerPrev = signal(false);
  protected readonly canScrollOwnerNext = signal(false);
  protected readonly canScrollLangPrev = signal(false);
  protected readonly canScrollLangNext = signal(false);

  constructor() {
    afterNextRender(() => {
      this.recomputeRailState(this.ownerRailEl()?.nativeElement, 'owner');
      this.recomputeRailState(this.langRailEl()?.nativeElement, 'lang');
    });
  }

  /* Helpers para los mini-cards de los rails. */
  protected colorOf(repo: Repository): string {
    return LANGUAGE_COLOR[repo.language] ?? FALLBACK_LANGUAGE_COLOR;
  }

  protected tierOf(repo: Repository): StarsTier {
    return tierForStars(repo.stars);
  }

  /** Resuelve el `User` propietario de un repo del rail (puede ser null
   *  si el dataset de usuarios aún no cargó o no contiene ese ownerId). */
  protected ownerOf(repo: Repository): User | null {
    return this.allUsers()?.find((u) => u.id === repo.ownerId) ?? null;
  }

  protected onAvatarError(): void {
    this.avatarFailed.set(true);
  }

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

  protected onOwnerRailScroll(): void {
    this.recomputeRailState(this.ownerRailEl()?.nativeElement, 'owner');
  }

  protected onLangRailScroll(): void {
    this.recomputeRailState(this.langRailEl()?.nativeElement, 'lang');
  }

  protected scrollOwnerPrev(): void {
    this.scrollRail(this.ownerRailEl()?.nativeElement, -1);
  }

  protected scrollOwnerNext(): void {
    this.scrollRail(this.ownerRailEl()?.nativeElement, 1);
  }

  protected scrollLangPrev(): void {
    this.scrollRail(this.langRailEl()?.nativeElement, -1);
  }

  protected scrollLangNext(): void {
    this.scrollRail(this.langRailEl()?.nativeElement, 1);
  }

  private scrollRail(el: HTMLElement | undefined, direction: -1 | 1): void {
    if (!el) return;
    const delta = el.clientWidth * 0.8 * direction;
    el.scrollBy({ left: delta, behavior: 'smooth' });
  }

  private recomputeRailState(el: HTMLElement | undefined, rail: 'owner' | 'lang'): void {
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const canPrev = el.scrollLeft > 0;
    const canNext = max > 0 && el.scrollLeft < max - 1;
    if (rail === 'owner') {
      this.canScrollOwnerPrev.set(canPrev);
      this.canScrollOwnerNext.set(canNext);
    } else {
      this.canScrollLangPrev.set(canPrev);
      this.canScrollLangNext.set(canNext);
    }
  }
}
