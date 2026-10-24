import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

describe('AuthService session state', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('restores the active user from browser storage', () => {
    localStorage.setItem('spacego.usuario', JSON.stringify({
      id: '1',
      nombre: 'María',
      correo: 'maria@example.com'
    }));

    const auth = TestBed.inject(AuthService);

    expect(auth.usuario()).toEqual({
      id: '1',
      nombre: 'María',
      correo: 'maria@example.com'
    });
  });

  it('clears the user and both storage locations when signing out', () => {
    localStorage.setItem('spacego.usuario', JSON.stringify({
      id: '1',
      nombre: 'María',
      correo: 'maria@example.com'
    }));
    sessionStorage.setItem('spacego.usuario', 'stale');

    const auth = TestBed.inject(AuthService);
    auth.cerrarSesion();

    expect(auth.usuario()).toBeNull();
    expect(localStorage.getItem('spacego.usuario')).toBeNull();
    expect(sessionStorage.getItem('spacego.usuario')).toBeNull();
  });
});
