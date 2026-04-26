import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';

import { UserCard } from '@shared/ui/user-card/user-card';
import { Paginator } from '@shared/ui/paginator/paginator';
import { Users } from './users';

@Component({
  selector: 'app-users-page',
  imports: [UserCard, Paginator],
  templateUrl: './users-page.html',
  styleUrl: './users-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UsersPage {
  private readonly usersService = inject(Users);

  protected readonly title = 'Usuarios';
  protected readonly pageSize = 6;

  protected readonly all = toSignal(this.usersService.list(), { initialValue: undefined });
  protected readonly page = signal(1);

  protected readonly total = computed(() => this.all()?.length ?? 0);
  protected readonly isLoading = computed(() => this.all() === undefined);

  protected readonly paged = computed(() => {
    const list = this.all();
    if (!list) return undefined;
    const start = (this.page() - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  protected readonly skeletonSlots = Array.from({ length: this.pageSize }, (_, i) => i);

  protected onPageChange(page: number): void {
    this.page.set(page);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }
}
