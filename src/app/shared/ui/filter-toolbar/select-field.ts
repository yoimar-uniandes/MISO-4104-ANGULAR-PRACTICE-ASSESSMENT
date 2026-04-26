import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface SelectOption<T extends string> {
  readonly value: T;
  readonly label: string;
}

/**
 * `<select>` controlado con placeholder.
 * Cuando el usuario elige el placeholder (cadena vacía) se emite `null`.
 */
@Component({
  selector: 'app-select-field',
  templateUrl: './select-field.html',
  styleUrl: './select-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'select-field' },
})
export class SelectField<T extends string = string> {
  readonly options = input.required<ReadonlyArray<SelectOption<T>>>();
  readonly value = input<T | null>(null);
  readonly placeholder = input('Todos');
  readonly ariaLabel = input.required<string>();

  readonly valueChange = output<T | null>();

  protected onChange(event: Event): void {
    const selected = (event.target as HTMLSelectElement).value;
    this.valueChange.emit(selected === '' ? null : (selected as T));
  }
}
