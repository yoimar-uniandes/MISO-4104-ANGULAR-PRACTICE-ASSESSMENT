import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export interface ChipOption<T> {
  readonly value: T;
  readonly label: string;
}

/**
 * Selector tipo "chips" — un valor activo a la vez (o ninguno).
 * Re-clickear el chip activo lo deselecciona y emite `null`.
 *
 * Genérico en `T` para reutilizarlo con cualquier dominio de valor primitivo
 * (string union, boolean, number, etc.).
 */
@Component({
  selector: 'app-chips-field',
  templateUrl: './chips-field.html',
  styleUrl: './chips-field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'chips-field',
  },
})
export class ChipsField<T> {
  readonly options = input.required<ReadonlyArray<ChipOption<T>>>();
  readonly value = input<T | null>(null);
  readonly ariaLabel = input.required<string>();

  readonly valueChange = output<T | null>();

  protected isActive(option: ChipOption<T>): boolean {
    return this.value() === option.value;
  }

  protected onClick(option: ChipOption<T>): void {
    this.valueChange.emit(this.isActive(option) ? null : option.value);
  }
}
