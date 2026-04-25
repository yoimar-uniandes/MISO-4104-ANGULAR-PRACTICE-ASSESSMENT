import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { type Observable, map, shareReplay } from 'rxjs';

import { environment } from '@env/environment';
import { User, type UserDto, type UserFilters } from './user';

/**
 * Servicio HTTP para Usuarios.
 *
 * Hace una sola llamada a `environment.apis.users` y comparte la respuesta
 * entre todos los suscriptores con `shareReplay`. Las consultas de búsqueda
 * son in-memory sobre el último snapshot.
 */
@Injectable({ providedIn: 'root' })
export class Users {
  private readonly http = inject(HttpClient);
  private readonly url = environment.apis.users;

  private readonly users$: Observable<readonly User[]> = this.http
    .get<readonly UserDto[]>(this.url)
    .pipe(
      map((dtos) => dtos.map((dto) => new User(dto))),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

  list(): Observable<readonly User[]> {
    return this.users$;
  }

  findById(id: number): Observable<User | undefined> {
    return this.users$.pipe(map((users) => users.find((user) => user.id === id)));
  }

  /**
   * Devuelve los usuarios que cumplen TODOS los filtros indicados (AND).
   * `search({})` ≡ `list()`.
   */
  search(filters: UserFilters): Observable<readonly User[]> {
    return this.users$.pipe(map((users) => users.filter((user) => user.matches(filters))));
  }
}
