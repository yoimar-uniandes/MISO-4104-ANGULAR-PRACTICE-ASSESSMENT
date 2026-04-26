import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
} from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { UserCard } from '@shared/ui/user-card/user-card';
import { Paginator } from '@shared/ui/paginator/paginator';
import {
  type ChipOption,
  ChipsField,
  FilterToolbar,
  SearchInputField,
  type SelectOption,
  SelectField,
} from '@shared/ui/filter-toolbar';
import { Users } from './users';
import type { Role, UserFilters } from './user';

@Component({
  selector: 'app-users-page',
  imports: [UserCard, Paginator, FilterToolbar, SearchInputField, ChipsField, SelectField],
  templateUrl: './users-page.html',
  styleUrl: './users-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly usersService = inject(Users);

  protected readonly title = 'Usuarios';
  protected readonly pageSize = 6;

  /* ── Estado de filtros ─────────────────────────────────────────────── */
  protected readonly query = signal('');
  protected readonly role = signal<Role | null>(null);
  protected readonly location = signal<string | null>(null);
  protected readonly hasRepos = signal<boolean | null>(null);
  protected readonly page = signal(1);

  protected readonly roleOptions: ReadonlyArray<ChipOption<Role>> = [
    { value: 'admin', label: 'Admin' },
    { value: 'developer', label: 'Developer' },
    { value: 'designer', label: 'Designer' },
  ];

  protected readonly hasReposOptions: ReadonlyArray<ChipOption<boolean>> = [
    { value: true, label: 'Con repos' },
    { value: false, label: 'Sin repos' },
  ];

  /* ── Datos ─────────────────────────────────────────────────────────── */
  private readonly all = toSignal(this.usersService.list(), { initialValue: undefined });

  /* Debounce sólo del input de texto; el resto se aplica al instante. */
  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(debounceTime(200), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly filters = computed<UserFilters>(() => {
    const f: { -readonly [K in keyof UserFilters]?: UserFilters[K] } = {};
    const q = this.debouncedQuery().trim();
    if (q.length > 0) f.query = q;
    const r = this.role();
    if (r !== null) f.role = r;
    const loc = this.location();
    if (loc !== null) f.location = loc;
    const hr = this.hasRepos();
    if (hr !== null) f.hasRepos = hr;
    return f;
  });

  protected readonly hasActiveFilters = computed(() => Object.keys(this.filters()).length > 0);

  protected readonly filtered = computed(() => {
    const list = this.all();
    if (!list) return undefined;
    return list.filter((u) => u.matches(this.filters()));
  });

  protected readonly locationOptions = computed<ReadonlyArray<SelectOption<string>>>(() => {
    const list = this.all();
    if (!list) return [];
    const seen = new Set<string>();
    for (const u of list) seen.add(u.location);
    return Array.from(seen)
      .sort((a, b) => a.localeCompare(b, 'es'))
      .map((loc) => ({ value: loc, label: loc }));
  });

  protected readonly total = computed(() => this.filtered()?.length ?? 0);
  protected readonly grandTotal = computed(() => this.all()?.length ?? 0);
  protected readonly isLoading = computed(() => this.all() === undefined);

  protected readonly paged = computed(() => {
    const list = this.filtered();
    if (!list) return undefined;
    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  protected readonly skeletonSlots = Array.from({ length: this.pageSize }, (_, i) => i);

  constructor() {
    /* Cualquier cambio en filtros nos devuelve a la página 1. */
    effect(() => {
      this.filters();
      untracked(() => {
        this.page.set(1);
      });
    });
  }

  protected onPageChange(page: number): void {
    this.page.set(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  protected onReset(): void {
    this.query.set('');
    this.role.set(null);
    this.location.set(null);
    this.hasRepos.set(null);
  }
}
