import { Component, inject } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  vistaActiva: 'login' | 'registro' = 'login';
  errorLogin: string | null = null;
  errorRegistro: string | null = null;
  cargandoLogin = false;
  cargandoRegistro = false;

  cambiarVista(vista: 'login' | 'registro'): void {
    this.vistaActiva = vista;
    this.errorLogin = null;
    this.errorRegistro = null;
  }

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    remember: [false]
  });

  registerForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    terms: [false, Validators.requiredTrue]
  });

  iniciarSesion(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    const { email, password, remember } = this.loginForm.getRawValue();
    this.errorLogin = null;
    this.cargandoLogin = true;

    this.authService.iniciarSesion(email ?? '', password ?? '', remember ?? false)
      .pipe(finalize(() => this.cargandoLogin = false))
      .subscribe({
        next: () => this.redirigirAlInicio('login'),
        error: error => this.errorLogin = this.mensajeError(error)
      });
  }

  registrarse(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.registerForm.getRawValue();
    this.errorRegistro = null;
    this.cargandoRegistro = true;

    this.authService.registrar(name ?? '', email ?? '', password ?? '')
      .pipe(finalize(() => this.cargandoRegistro = false))
      .subscribe({
        next: () => this.redirigirAlInicio('registro'),
        error: error => this.errorRegistro = this.mensajeError(error)
      });
  }

  private redirigirAlInicio(vista: 'login' | 'registro'): void {
    this.router.navigateByUrl('/').then(navego => {
      if (!navego) {
        this.mostrarErrorRedireccion(vista);
      }
    }).catch(() => {
      this.mostrarErrorRedireccion(vista);
    });
  }

  private mostrarErrorRedireccion(vista: 'login' | 'registro'): void {
    const mensaje = 'La sesión se inició, pero no se pudo abrir la página de inicio.';
    if (vista === 'login') {
      this.errorLogin = mensaje;
    } else {
      this.errorRegistro = mensaje;
    }
  }

  private mensajeError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con la API local. Inicia el servidor con "npm run api".';
      }
      return 'El servidor no pudo completar la solicitud. Inténtalo de nuevo.';
    }

    if (error instanceof Error) {
      return error.message;
    }

    return 'No se pudo conectar con el servicio. Comprueba que la API local esté iniciada.';
  }
}