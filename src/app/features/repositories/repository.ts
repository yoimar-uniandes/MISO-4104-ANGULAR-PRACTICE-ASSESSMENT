/** Forma cruda del JSON externo (DTO). */
export interface RepositoryDto {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly language: string;
  readonly stars: number;
  readonly createdAt: string;
  readonly ownerId: number;
}

export interface RepositoryFilters {
  /** Coincidencia exacta de lenguaje (case-insensitive). */
  readonly language?: string;
  /** Filtra por dueño (User.id). */
  readonly ownerId?: number;
  /** Mínimo inclusivo de estrellas. */
  readonly minStars?: number;
  /** Máximo inclusivo de estrellas. */
  readonly maxStars?: number;
  /** Coincidencia parcial (case-insensitive) sobre `name` o `description`. */
  readonly query?: string;
  /** Fecha ISO (`YYYY-MM-DD`); incluye repos creados en esa fecha o después. */
  readonly createdAfter?: string;
  /** Fecha ISO (`YYYY-MM-DD`); incluye repos creados en esa fecha o antes. */
  readonly createdBefore?: string;
}

/**
 * Entidad de dominio Repositorio.
 *
 * Inmutable; las propiedades son `readonly`. Los métodos exponen el
 * comportamiento natural del dominio (popularidad, comparación de fechas,
 * coincidencia con filtros).
 */
export class Repository {
  readonly id: number;
  readonly name: string;
  readonly description: string;
  readonly language: string;
  readonly stars: number;
  readonly createdAt: string;
  readonly ownerId: number;

  constructor(dto: RepositoryDto) {
    this.id = dto.id;
    this.name = dto.name;
    this.description = dto.description;
    this.language = dto.language;
    this.stars = dto.stars;
    this.createdAt = dto.createdAt;
    this.ownerId = dto.ownerId;
  }

  /** `Date` parseado a partir del campo `createdAt` ISO. */
  get createdAtDate(): Date {
    return new Date(this.createdAt);
  }

  isOwnedBy(userId: number): boolean {
    return this.ownerId === userId;
  }

  isPopular(threshold = 100): boolean {
    return this.stars >= threshold;
  }

  matches(filters: RepositoryFilters): boolean {
    if (
      filters.language !== undefined &&
      this.language.toLowerCase() !== filters.language.toLowerCase()
    ) {
      return false;
    }
    if (filters.ownerId !== undefined && this.ownerId !== filters.ownerId) {
      return false;
    }
    if (filters.minStars !== undefined && this.stars < filters.minStars) {
      return false;
    }
    if (filters.maxStars !== undefined && this.stars > filters.maxStars) {
      return false;
    }
    if (filters.query !== undefined) {
      const q = filters.query.toLowerCase();
      if (!this.name.toLowerCase().includes(q) && !this.description.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filters.createdAfter !== undefined && this.createdAt < filters.createdAfter) {
      return false;
    }
    if (filters.createdBefore !== undefined && this.createdAt > filters.createdBefore) {
      return false;
    }
    return true;
  }
}
