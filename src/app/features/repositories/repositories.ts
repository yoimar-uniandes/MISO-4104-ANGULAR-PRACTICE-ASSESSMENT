import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type Observable, map, shareReplay } from 'rxjs';

import { environment } from '@env/environment';
import { Repository, type RepositoryDto, type RepositoryFilters } from './repository';

/**
 * Servicio HTTP para Repositorios.
 *
 * Hace una sola llamada a `environment.apis.repositories` y comparte la
 * respuesta entre todos los suscriptores con `shareReplay`. Las consultas
 * de búsqueda son in-memory sobre el último snapshot.
 */
@Injectable({ providedIn: 'root' })
export class Repositories {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apis.repositories;

  private readonly repos$: Observable<readonly Repository[]> = this.http
    .get<readonly RepositoryDto[]>(this.url)
    .pipe(
      map((dtos) => dtos.map((dto) => new Repository(dto))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  list(): Observable<readonly Repository[]> {
    return this.repos$;
  }

  findById(id: number): Observable<Repository | undefined> {
    return this.repos$.pipe(map((repos) => repos.find((repo) => repo.id === id)));
  }

  findByOwnerId(ownerId: number): Observable<readonly Repository[]> {
    return this.repos$.pipe(map((repos) => repos.filter((repo) => repo.isOwnedBy(ownerId))));
  }

  /**
   * Devuelve los repos que cumplen TODOS los filtros indicados (AND).
   * `search({})` ≡ `list()`.
   */
  search(filters: RepositoryFilters): Observable<readonly Repository[]> {
    return this.repos$.pipe(map((repos) => repos.filter((repo) => repo.matches(filters))));
  }
}
