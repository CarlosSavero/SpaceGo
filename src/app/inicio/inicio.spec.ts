import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Inicio } from './inicio';

describe('Inicio', () => {
  let component: Inicio;
  let fixture: ComponentFixture<Inicio>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
      imports: [Inicio],
    }).compileComponents();

    fixture = TestBed.createComponent(Inicio);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the signed-in profile and logs out from the navigation', () => {
    component.auth.usuario.set({
      id: '1',
      nombre: 'María',
      correo: 'maria@example.com'
    });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('María');
    expect(fixture.nativeElement.textContent).toContain('Cerrar sesión');
    expect(fixture.nativeElement.querySelector('a[href="/login"]')).toBeNull();

    fixture.nativeElement.querySelector('.btn-logout-nav').click();
    fixture.detectChanges();

    expect(component.auth.usuario()).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Iniciar Sesión');
    expect(fixture.nativeElement.querySelector('.btn-logout-nav')).toBeNull();
  });
});
