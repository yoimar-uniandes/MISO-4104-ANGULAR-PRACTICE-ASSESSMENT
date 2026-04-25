import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';

import { environment } from '@env/environment';
import { Repositories, type RepositoryDto } from '@features/repositories';

const FIXTURE: RepositoryDto[] = [
  {
    id: 101,
    name: 'repo-101',
    description: 'Angular project',
    language: 'TypeScript',
    stars: 50,
    createdAt: '2025-01-01',
    ownerId: 1,
  },
  {
    id: 102,
    name: 'repo-102',
    description: 'NestJS API',
    language: 'TypeScript',
    stars: 40,
    createdAt: '2025-01-05',
    ownerId: 1,
  },
  {
    id: 121,
    name: 'repo-121',
    description: 'AI model',
    language: 'Python',
    stars: 120,
    createdAt: '2025-03-22',
    ownerId: 15,
  },
];

describe('Repositories (service)', () => {
  let service: Repositories;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(Repositories);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  function flushFixture(): void {
    const req = httpMock.expectOne(environment.apis.repositories);
    expect(req.request.method).toBe('GET');
    req.flush(FIXTURE);
  }

  it('should fetch repositories via HTTP and return Repository instances', async () => {
    const promise = firstValueFrom(service.list());
    flushFixture();
    const repos = await promise;

    expect(repos.length).toBe(3);
    expect(repos[0]?.constructor.name).toBe('Repository');
    expect(repos[0]?.id).toBe(101);
  });

  it('should share the HTTP response across subscribers (single GET)', async () => {
    const p1 = firstValueFrom(service.list());
    const p2 = firstValueFrom(service.findByOwnerId(1));
    flushFixture();

    expect((await p1).length).toBe(3);
    expect((await p2).length).toBe(2);
  });

  it('should find a repository by id', async () => {
    const promise = firstValueFrom(service.findById(121));
    flushFixture();
    expect((await promise)?.name).toBe('repo-121');
  });

  it('should return repositories owned by a user', async () => {
    const promise = firstValueFrom(service.findByOwnerId(1));
    flushFixture();
    const repos = await promise;
    expect(repos.map((r) => r.id).sort()).toEqual([101, 102]);
  });

  it('should filter by language (case-insensitive)', async () => {
    const promise = firstValueFrom(service.search({ language: 'typescript' }));
    flushFixture();
    const repos = await promise;
    expect(repos.every((r) => r.language === 'TypeScript')).toBe(true);
    expect(repos.length).toBe(2);
  });

  it('should filter by stars range', async () => {
    const promise = firstValueFrom(service.search({ minStars: 50, maxStars: 100 }));
    flushFixture();
    const repos = await promise;
    expect(repos.map((r) => r.id).sort()).toEqual([101]);
  });

  it('should filter by query against name OR description', async () => {
    const promise = firstValueFrom(service.search({ query: 'nestjs' }));
    flushFixture();
    const repos = await promise;
    expect(repos.map((r) => r.id)).toEqual([102]);
  });

  it('should filter by createdAfter (inclusive)', async () => {
    const promise = firstValueFrom(service.search({ createdAfter: '2025-03-01' }));
    flushFixture();
    const repos = await promise;
    expect(repos.map((r) => r.id)).toEqual([121]);
  });

  it('should AND multiple filters', async () => {
    const promise = firstValueFrom(service.search({ language: 'TypeScript', minStars: 45 }));
    flushFixture();
    const repos = await promise;
    expect(repos.map((r) => r.id)).toEqual([101]);
  });
});
