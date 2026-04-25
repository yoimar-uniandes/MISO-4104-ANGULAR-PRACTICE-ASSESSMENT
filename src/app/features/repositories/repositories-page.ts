import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-repositories-page',
  templateUrl: './repositories-page.html',
  styleUrl: './repositories-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RepositoriesPage {
  protected readonly title = 'Repositorios';
}
