import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

type PageItem = number | 'gap';

@Component({
  selector: 'app-paginator',
  templateUrl: './paginator.html',
  styleUrl: './paginator.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'navigation',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'paginator',
  },
})
export class Paginator {
  readonly total = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly page = input.required<number>();
  readonly siblingCount = input(1);
  readonly ariaLabel = input('Paginación');

  readonly pageChange = output<number>();

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.total() / this.pageSize())),
  );

  protected readonly current = computed(() => Math.min(Math.max(1, this.page()), this.pageCount()));

  protected readonly canPrev = computed(() => this.current() > 1);
  protected readonly canNext = computed(() => this.current() < this.pageCount());

  protected readonly pages = computed<readonly PageItem[]>(() => {
    const last = this.pageCount();
    const cur = this.current();
    const sib = this.siblingCount();
    const totalNumbers = sib * 2 + 5;

    if (last <= totalNumbers) {
      return Array.from({ length: last }, (_, i) => i + 1);
    }

    const leftSib = Math.max(cur - sib, 1);
    const rightSib = Math.min(cur + sib, last);
    const showLeftGap = leftSib > 2;
    const showRightGap = rightSib < last - 1;

    const items: PageItem[] = [1];

    if (showLeftGap) {
      items.push('gap');
    } else {
      for (let i = 2; i < leftSib; i++) items.push(i);
    }

    for (let i = leftSib; i <= rightSib; i++) {
      if (i !== 1 && i !== last) items.push(i);
    }

    if (showRightGap) {
      items.push('gap');
    } else {
      for (let i = rightSib + 1; i < last; i++) items.push(i);
    }

    items.push(last);
    return items;
  });

  protected goTo(page: number): void {
    const target = Math.min(Math.max(1, page), this.pageCount());
    if (target !== this.current()) {
      this.pageChange.emit(target);
    }
  }

  protected prev(): void {
    if (this.canPrev()) this.goTo(this.current() - 1);
  }

  protected next(): void {
    if (this.canNext()) this.goTo(this.current() + 1);
  }
}
