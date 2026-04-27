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
import { ActivatedRoute } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';

import { RepositoryCard } from '@shared/ui/repository-card/repository-card';
import { Paginator } from '@shared/ui/paginator/paginator';
import {
  type ChipOption,
  ChipsField,
  FilterToolbar,
  SearchInputField,
  type SelectOption,
  SelectField,
} from '@shared/ui/filter-toolbar';
import { Users } from '@features/users';
import type { User } from '@features/users/user';
import { Repositories } from './repositories';
import type { Repository, RepositoryFilters } from './repository';

interface RepoEntry {
  readonly repo: Repository;
  readonly owner: User | null;
}

const POPULARITY_THRESHOLD = 100;

@Component({
  selector: 'app-repositories-page',
  imports: [RepositoryCard, Paginator, FilterToolbar, SearchInputField, ChipsField, SelectField],
  templateUrl: './repositories-page.html',
  styleUrl: './repositories-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriesPage {
  private readonly reposService = inject(Repositories);
  private readonly usersService = inject(Users);
  private readonly route = inject(ActivatedRoute);

  protected readonly title = 'Repositorios';
  protected readonly pageSize = 6;

  /**
   * Query param `?owner=:id` leído reactivamente desde `ActivatedRoute`.
   * Cuando se entra desde el badge de repositorios de un `UserCard`,
   * pre-aplica el filtro de propietario.
   */
  private readonly ownerFromUrl = toSignal(
    this.route.queryParamMap
      .pipe
      // Map a string | null para comparar/asignar fácilmente.
      // (queryParamMap.get devuelve null cuando no existe).
      (),
    { initialValue: this.route.snapshot.queryParamMap },
  );

  /* ── Estado de filtros ─────────────────────────────────────────────── */
  protected readonly query = signal('');
  protected readonly language = signal<string | null>(null);
  protected readonly ownerIdStr = signal<string | null>(null);
  protected readonly popularidad = signal<boolean | null>(null);
  protected readonly page = signal(1);

  protected readonly popularidadOptions: ReadonlyArray<ChipOption<boolean>> = [
    { value: true, label: 'Populares' },
    { value: false, label: 'Emergentes' },
  ];

  /* ── Datos ─────────────────────────────────────────────────────────── */
  private readonly allRepos = toSignal(this.reposService.list(), { initialValue: undefined });
  private readonly allUsers = toSignal(this.usersService.list(), { initialValue: undefined });

  private readonly userById = computed<ReadonlyMap<number, User> | null>(() => {
    const list = this.allUsers();
    if (!list) return null;
    const map = new Map<number, User>();
    for (const u of list) map.set(u.id, u);
    return map;
  });

  /* Debounce sólo del input de texto. */
  private readonly debouncedQuery = toSignal(
    toObservable(this.query).pipe(debounceTime(200), distinctUntilChanged()),
    { initialValue: '' },
  );

  protected readonly filters = computed<RepositoryFilters>(() => {
    const f: { -readonly [K in keyof RepositoryFilters]?: RepositoryFilters[K] } = {};
    const q = this.debouncedQuery().trim();
    if (q.length > 0) f.query = q;
    const lang = this.language();
    if (lang !== null) f.language = lang;
    const oid = this.ownerIdStr();
    if (oid !== null) f.ownerId = Number(oid);
    const pop = this.popularidad();
    if (pop === true) f.minStars = POPULARITY_THRESHOLD;
    if (pop === false) f.maxStars = POPULARITY_THRESHOLD - 1;
    return f;
  });

  protected readonly hasActiveFilters = computed(() => Object.keys(this.filters()).length > 0);

  protected readonly filtered = computed(() => {
    const list = this.allRepos();
    if (!list) return undefined;
    return list.filter((r) => r.matches(this.filters()));
  });

  /* Opciones de filtro derivadas del snapshot. */
  protected readonly languageOptions = computed<ReadonlyArray<SelectOption<string>>>(() => {
    const list = this.allRepos();
    if (!list) return [];
    const seen = new Set<string>();
    for (const r of list) seen.add(r.language);
    return Array.from(seen)
      .sort((a, b) => a.localeCompare(b))
      .map((lang) => ({ value: lang, label: lang }));
  });

  protected readonly ownerOptions = computed<ReadonlyArray<SelectOption<string>>>(() => {
    const users = this.allUsers();
    if (!users) return [];
    /* Incluimos a TODOS los usuarios — incluso los que no mantienen
       repositorios — para que el filtro pueda seleccionarlos (entrada
       desde el badge "Sin repositorios" del UserCard) y el SelectField
       muestre el label correcto. */
    return [...users]
      .sort((a, b) => a.name.localeCompare(b.name, 'es'))
      .map((u) => ({ value: String(u.id), label: u.name }));
  });

  protected readonly total = computed(() => this.filtered()?.length ?? 0);
  protected readonly grandTotal = computed(() => this.allRepos()?.length ?? 0);
  protected readonly isLoading = computed(
    () => this.allRepos() === undefined || this.allUsers() === undefined,
  );

  protected readonly paged = computed<readonly RepoEntry[] | undefined>(() => {
    const list = this.filtered();
    if (!list) return undefined;
    const map = this.userById();
    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize).map((repo) => ({
      repo,
      owner: map?.get(repo.ownerId) ?? null,
    }));
  });

  protected readonly skeletonSlots = Array.from({ length: this.pageSize }, (_, i) => i);

  constructor() {
    /* Cuando se entra desde un UserCard con `?owner=:id`, sincroniza el
       query param al filtro interno. `untracked` para no crear un loop
       cuando el efecto siguiente lee el filtro derivado. */
    effect(() => {
      const fromUrl = this.ownerFromUrl().get('owner');
      if (fromUrl !== null) {
        const current = untracked(() => this.ownerIdStr());
        if (current !== fromUrl) {
          this.ownerIdStr.set(fromUrl);
        }
      }
    });

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
    this.language.set(null);
    this.ownerIdStr.set(null);
    this.popularidad.set(null);
  }
}
