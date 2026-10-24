import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, from, of, switchMap, throwError, map } from 'rxjs';

interface UsuarioRegistro {
  id: string | number;
  nombre: string;
  correo: string;
  salt: string;
  passwordHash: string;
}

export interface UsuarioSesion {
  id: string | number;
  nombre: string;
  correo: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:3000/usuarios';
  private readonly sessionKey = 'spacego.usuario';
  readonly usuario = signal<UsuarioSesion | null>(this.leerSesion());

  registrar(nombre: string, correo: string, password: string): Observable<UsuarioSesion> {
    const correoNormalizado = correo.trim().toLowerCase();

    return this.buscarPorCorreo(correoNormalizado).pipe(
      switchMap(usuarios => {
        if (usuarios.length > 0) {
          return throwError(() => new Error('Ya existe una cuenta con ese correo.'));
        }

        return from(this.crearCredenciales(password)).pipe(
          switchMap(credenciales => this.http.post<UsuarioRegistro>(this.apiUrl, {
            nombre: nombre.trim(),
            correo: correoNormalizado,
            ...credenciales
          })),
          map(usuario => this.iniciarSesionLocal(usuario, false))
        );
      })
    );
  }

  iniciarSesion(correo: string, password: string, recordar: boolean): Observable<UsuarioSesion> {
    const correoNormalizado = correo.trim().toLowerCase();

    return this.buscarPorCorreo(correoNormalizado).pipe(
      switchMap(usuarios => {
        const usuario = usuarios[0];
        if (!usuario) {
          return throwError(() => new Error('Correo o contraseña incorrectos.'));
        }

        return from(this.calcularHash(password, usuario.salt)).pipe(
          switchMap(passwordHash => passwordHash === usuario.passwordHash
            ? of(this.iniciarSesionLocal(usuario, recordar))
            : throwError(() => new Error('Correo o contraseña incorrectos.')))
        );
      })
    );
  }

  cerrarSesion(): void {
    localStorage.removeItem(this.sessionKey);
    sessionStorage.removeItem(this.sessionKey);
    this.usuario.set(null);
  }

  private buscarPorCorreo(correo: string): Observable<UsuarioRegistro[]> {
    const params = new HttpParams().set('correo', correo);
    return this.http.get<UsuarioRegistro[]>(this.apiUrl, { params });
  }

  private async crearCredenciales(password: string): Promise<{
    salt: string;
    passwordHash: string;
  }> {
    const salt = this.bytesToHex(crypto.getRandomValues(new Uint8Array(16)));
    return { salt, passwordHash: await this.calcularHash(password, salt) };
  }

  private async calcularHash(password: string, salt: string): Promise<string> {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits({
      name: 'PBKDF2',
      salt: this.hexToBytes(salt),
      iterations: 120_000,
      hash: 'SHA-256'
    }, key, 256);

    return this.bytesToHex(new Uint8Array(bits));
  }

  private iniciarSesionLocal(usuario: UsuarioRegistro, recordar: boolean): UsuarioSesion {
    const sesion: UsuarioSesion = {
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo
    };

    const destino = recordar ? localStorage : sessionStorage;
    const otroDestino = recordar ? sessionStorage : localStorage;
    otroDestino.removeItem(this.sessionKey);
    destino.setItem(this.sessionKey, JSON.stringify(sesion));
    this.usuario.set(sesion);

    return sesion;
  }

  private leerSesion(): UsuarioSesion | null {
    const sesionGuardada = localStorage.getItem(this.sessionKey)
      ?? sessionStorage.getItem(this.sessionKey);
    if (!sesionGuardada) return null;

    try {
      const sesion: unknown = JSON.parse(sesionGuardada);
      if (
        typeof sesion === 'object' &&
        sesion !== null &&
        'id' in sesion &&
        (typeof sesion.id === 'string' || typeof sesion.id === 'number') &&
        'nombre' in sesion &&
        typeof sesion.nombre === 'string' &&
        'correo' in sesion &&
        typeof sesion.correo === 'string'
      ) {
        return {
          id: sesion.id,
          nombre: sesion.nombre,
          correo: sesion.correo
        };
      }
    } catch {
      localStorage.removeItem(this.sessionKey);
      sessionStorage.removeItem(this.sessionKey);
    }

    return null;
  }

  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  private hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
    const bytes = new Uint8Array(new ArrayBuffer(hex.length / 2));
    for (let index = 0; index < bytes.length; index++) {
      bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
    }
    return bytes;
  }
}
