import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

/**
 * Shell de toolbar de filtros — agnóstico al dominio.
 *
 * Provee layout responsive (flex-wrap) y el botón "Limpiar" que se muestra
 * sólo cuando hay filtros activos. Los campos concretos (search, chips,
 * select, etc.) se proyectan vía `<ng-content>`.
 */
@Component({
  selector: 'app-filter-toolbar',
  templateUrl: './filter-toolbar.html',
  styleUrl: './filter-toolbar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    '[attr.aria-label]': 'ariaLabel()',
    class: 'filter-toolbar',
  },
})
export class FilterToolbar {
  readonly ariaLabel = input('Filtros');
  readonly hasActive = input(false);
  readonly resetLabel = input('Limpiar filtros');

  readonly clear = output();

  protected onClear(): void {
    this.clear.emit();
  }
}
