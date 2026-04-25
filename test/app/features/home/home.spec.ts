import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { Home } from '@features/home/home';

describe('Home', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create', () => {
    const fixture = TestBed.createComponent(Home);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should render the GhQuerry hero title', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain('GhQuerry');
  });

  it('should render both messages and CTAs', async () => {
    const fixture = TestBed.createComponent(Home);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    const messages = compiled.querySelectorAll('.hero__message');
    expect(messages.length).toBe(2);
    const ctas = compiled.querySelectorAll('.hero__btn');
    expect(ctas.length).toBe(2);
  });
});
