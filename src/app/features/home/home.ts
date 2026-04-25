import { ChangeDetectionStrategy, Component, signal } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Home {
  protected readonly greeting = signal('Hello, world!');
}
