import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

let nextSearchId = 0;

@Component({
  selector: 'app-search-input',
  templateUrl: './search-input-field.html',
  styleUrl: './search-input-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'search-input' },
})
export class SearchInputField {
  readonly value = input.required<string>();
  readonly placeholder = input('Buscar…');
  readonly ariaLabel = input.required<string>();
  readonly inputId = input<string | null>(null);

  readonly valueChange = output<string>();

  protected readonly fallbackId = `app-search-${String(++nextSearchId)}`;
  protected readonly resolvedId = computed(() => this.inputId() ?? this.fallbackId);

  protected onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.valueChange.emit(target.value);
  }

  protected onClear(): void {
    this.valueChange.emit('');
  }
}
