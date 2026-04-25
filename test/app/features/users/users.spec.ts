import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { Users, type UserDto } from '@features/users';

const FIXTURE: UserDto[] = [
  {
    id: 1,
    username: 'user1',
    name: 'User One',
    email: 'user1@mail.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=1',
    role: 'admin',
    location: 'Bogotá',
    repoIds: [101, 102],
  },
  {
    id: 2,
    username: 'user2',
    name: 'User Two',
    email: 'user2@mail.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=2',
    role: 'developer',
    location: 'Medellín',
    repoIds: [103],
  },
  {
    id: 22,
    username: 'user22',
    name: 'User Twenty Two',
    email: 'user22@mail.com',
    avatarUrl: 'https://i.pravatar.cc/150?img=22',
    role: 'developer',
    location: 'Florencia',
    repoIds: [],
  },
];

describe('Users (service)', () => {
  let service: Users;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Users);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushFixture(): void {
    const req = httpMock.expectOne(environment.apis.users);
    expect(req.request.method).toBe('GET');
    req.flush(FIXTURE);
  }

  it('should fetch users via HTTP and return User instances', async () => {
    const promise = firstValueFrom(service.list());
    flushFixture();
    const users = await promise;

    expect(users.length).toBe(3);
    expect(users[0]?.id).toBe(1);
    expect(users[0]?.constructor.name).toBe('User');
  });

  it('should share the HTTP response across subscribers (single GET)', async () => {
    const p1 = firstValueFrom(service.list());
    const p2 = firstValueFrom(service.findById(2));
    flushFixture();

    const users = await p1;
    const user = await p2;
    expect(users.length).toBe(3);
    expect(user?.username).toBe('user2');
    // verify() at afterEach garantiza que solo hubo 1 GET.
  });

  it('should find a user by id', async () => {
    const promise = firstValueFrom(service.findById(2));
    flushFixture();
    const user = await promise;
    expect(user?.username).toBe('user2');
  });

  it('should return undefined for unknown id', async () => {
    const promise = firstValueFrom(service.findById(9999));
    flushFixture();
    expect(await promise).toBeUndefined();
  });

  it('should filter by role', async () => {
    const promise = firstValueFrom(service.search({ role: 'admin' }));
    flushFixture();
    const users = await promise;
    expect(users.map((u) => u.id)).toEqual([1]);
  });

  it('should filter by location (case-insensitive)', async () => {
    const promise = firstValueFrom(service.search({ location: 'BOG' }));
    flushFixture();
    const users = await promise;
    expect(users.map((u) => u.location)).toEqual(['Bogotá']);
  });

  it('should filter by query against name OR username', async () => {
    const promise = firstValueFrom(service.search({ query: 'twenty two' }));
    flushFixture();
    const users = await promise;
    expect(users.map((u) => u.id)).toEqual([22]);
  });

  it('should filter by hasRepos', async () => {
    const promise = firstValueFrom(service.search({ hasRepos: false }));
    flushFixture();
    const users = await promise;
    expect(users.map((u) => u.id)).toEqual([22]);
  });

  it('should AND multiple filters', async () => {
    const promise = firstValueFrom(service.search({ role: 'developer', hasRepos: true }));
    flushFixture();
    const users = await promise;
    expect(users.map((u) => u.id)).toEqual([2]);
  });
});
