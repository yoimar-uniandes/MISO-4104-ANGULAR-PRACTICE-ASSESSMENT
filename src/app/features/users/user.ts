export type Role = 'admin' | 'developer' | 'designer';

/** Forma cruda del JSON externo (DTO). */
export interface UserDto {
  readonly id: number;
  readonly username: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string;
  readonly role: Role;
  readonly location: string;
  readonly repoIds: readonly number[];
}

export interface UserFilters {
  /** Coincidencia exacta de rol. */
  readonly role?: Role;
  /** Coincidencia parcial (case-insensitive) sobre `location`. */
  readonly location?: string;
  /** Coincidencia parcial (case-insensitive) sobre `name` o `username`. */
  readonly query?: string;
  /** `true` → solo usuarios con al menos un repo; `false` → solo sin repos. */
  readonly hasRepos?: boolean;
}

/**
 * Entidad de dominio Usuario.
 *
 * Inmutable; las propiedades son `readonly`. Los métodos exponen el
 * comportamiento natural del dominio (¿tiene repos?, ¿coincide con un filtro?).
 */
export class User {
  readonly id: number;
  readonly username: string;
  readonly name: string;
  readonly email: string;
  readonly avatarUrl: string;
  readonly role: Role;
  readonly location: string;
  readonly repoIds: readonly number[];

  constructor(dto: UserDto) {
    this.id = dto.id;
    this.username = dto.username;
    this.name = dto.name;
    this.email = dto.email;
    this.avatarUrl = dto.avatarUrl;
    this.role = dto.role;
    this.location = dto.location;
    this.repoIds = [...dto.repoIds];
  }

  /** Útil para `*ngFor` y consumidores que usan `id` como display name. */
  get displayName(): string {
    return this.name;
  }

  hasRepos(): boolean {
    return this.repoIds.length > 0;
  }

  ownsRepo(repoId: number): boolean {
    return this.repoIds.includes(repoId);
  }

  matches(filters: UserFilters): boolean {
    if (filters.role !== undefined && this.role !== filters.role) {
      return false;
    }
    if (
      filters.location !== undefined &&
      !this.location.toLowerCase().includes(filters.location.toLowerCase())
    ) {
      return false;
    }
    if (filters.query !== undefined) {
      const q = filters.query.toLowerCase();
      if (!this.name.toLowerCase().includes(q) && !this.username.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.hasRepos !== undefined && this.hasRepos() !== filters.hasRepos) {
      return false;
    }
    return true;
  }
}
