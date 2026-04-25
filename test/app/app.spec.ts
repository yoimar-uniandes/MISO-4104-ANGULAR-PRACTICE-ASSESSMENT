import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from '@app/app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('should expose the project title as a signal', () => {
    const fixture = TestBed.createComponent(App);
    const instance = fixture.componentInstance as unknown as { title: () => string };
    expect(instance.title()).toBe('MISO-4104-ANGULAR-PRACTICE-ASSESSMENT');
  });
});
