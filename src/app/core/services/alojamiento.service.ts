import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Alojamiento } from '../../models/alojamiento';

@Injectable({
  providedIn: 'root'
})
export class AlojamientoService {

  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/alojamientos';
  private apiFavoritosUrl = 'http://localhost:3000/favoritos';

  private fallbackAlojamientos: Alojamiento[] = [
    {
      id: 1,
      titulo: 'Habitación individual amoblada',
      tipo: 'individual',
      precio: 650,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'San Miguel',
      imagen: '/Imagenes/depto01-dormitorio-principal.avif',
      descripcion: 'Habitación privada con baño compartido, wifi y limpieza semanal.',
      fecha: '2026-08-25'
    },
    {
      id: 2,
      titulo: 'Cuarto individual cerca a la universidad',
      tipo: 'individual',
      precio: 480,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'San Miguel',
      imagen: '/Imagenes/depto02-dormitorio-secundario.avif',
      descripcion: 'Ideal para estudiantes, a 10 minutos caminando de la av. La Marina.',
      fecha: '2026-08-10'
    },
    {
      id: 3,
      titulo: 'Habitación individual con balcón',
      tipo: 'individual',
      precio: 790,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Pueblo Libre',
      imagen: '/Imagenes/depto03-balcon-vista.avif',
      descripcion: 'Espacio amplio, con balcón propio e internet de alta velocidad.',
      fecha: '2026-08-28'
    },
    {
      id: 4,
      titulo: 'Espacio para pareja en San Miguel',
      tipo: 'pareja',
      precio: 950,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'San Miguel',
      imagen: '/Imagenes/depto06-dormitorio-matrimonial.avif',
      descripcion: 'Ambiente cómodo con baño propio, cocina compartida y cochera.',
      fecha: '2026-08-15'
    },
    {
      id: 5,
      titulo: 'Cuarto matrimonial en Miraflores',
      tipo: 'pareja',
      precio: 1300,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Miraflores',
      imagen: '/Imagenes/depto09-dormitorio.avif',
      descripcion: 'A pocas cuadras del malecón, incluye servicios básicos.',
      fecha: '2026-07-30'
    },
    {
      id: 6,
      titulo: 'Minidepartamento independiente',
      tipo: 'minidepa',
      precio: 1100,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'San Miguel',
      imagen: '/Imagenes/depto01-sala-comedor.avif',
      descripcion: 'Sala-comedor, un dormitorio y cocina propia. Ingreso independiente.',
      fecha: '2026-08-22'
    },
    {
      id: 7,
      titulo: 'Minidepartamento amoblado en Surco',
      tipo: 'minidepa',
      precio: 1450,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Surco',
      imagen: '/Imagenes/depto04-sala-estar.avif',
      descripcion: 'Totalmente amoblado, con seguridad las 24 horas.',
      fecha: '2026-08-05'
    },
    {
      id: 8,
      titulo: 'Departamento de 2 habitaciones',
      tipo: 'departamento',
      precio: 2200,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'San Borja',
      imagen: '/Imagenes/depto06-living-room.avif',
      descripcion: 'Departamento completo, dos baños y cochera incluida.',
      fecha: '2026-08-18'
    },
    {
      id: 9,
      titulo: 'Departamento familiar en Los Olivos',
      tipo: 'departamento',
      precio: 1800,
      departamento: 'Lima',
      provincia: 'Lima',
      distrito: 'Los Olivos',
      imagen: '/Imagenes/depto07-sala-amplia.avif',
      descripcion: 'Tres dormitorios, ideal para compartir entre varias personas.',
      fecha: '2026-06-12'
    },
    {
      id: 10,
      titulo: 'Habitación individual en Cercado',
      tipo: 'individual',
      precio: 420,
      departamento: 'Arequipa',
      provincia: 'Arequipa',
      distrito: 'Cercado',
      imagen: '/Imagenes/depto08-dormitorio-visitas.avif',
      descripcion: 'Cerca a la plaza de armas, incluye agua y luz.',
      fecha: '2026-07-20'
    },
    {
      id: 11,
      titulo: 'Minidepartamento en Yanahuara',
      tipo: 'minidepa',
      precio: 980,
      departamento: 'Arequipa',
      provincia: 'Arequipa',
      distrito: 'Yanahuara',
      imagen: '/Imagenes/depto05-cocina-lineal.avif',
      descripcion: 'Vista a la campiña, cocina y baño propios.',
      fecha: '2026-08-01'
    },
    {
      id: 12,
      titulo: 'Espacio para pareja en Wanchaq',
      tipo: 'pareja',
      precio: 750,
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Wanchaq',
      imagen: '/Imagenes/depto04-dormitorio.avif',
      descripcion: 'Habitación amplia con calefacción y baño privado.',
      fecha: '2026-06-28'
    },
    {
      id: 13,
      titulo: 'Habitación individual en Cusco centro',
      tipo: 'individual',
      precio: 560,
      departamento: 'Cusco',
      provincia: 'Cusco',
      distrito: 'Cusco',
      imagen: '/Imagenes/depto09-principal.avif',
      descripcion: 'A dos cuadras de la plaza principal, agua caliente todo el día.',
      fecha: '2026-08-30'
    }
  ];



  obtenerAlojamientos(): Observable<Alojamiento[]> {
    return this.http.get<Alojamiento[]>(this.apiUrl).pipe(
      catchError(() => {
        console.warn('La API no está disponible. Usando datos locales.');
        return of(this.fallbackAlojamientos);
      })
    );
  }

  obtenerFavoritos(): Observable<{ id: string | number; alojamientoId: string | number }[]> {
    return this.http.get<{ id: string | number; alojamientoId: string | number }[]>(this.apiFavoritosUrl);
  }

  agregarFavorito(alojamientoId: string | number): Observable<any> {
    return this.obtenerFavoritos().pipe(
      switchMap((favoritos) => {
        const yaExiste = favoritos.some(
          favorito => String(favorito.alojamientoId) === String(alojamientoId)
        );

        if (yaExiste) {
          return of(favoritos.find(
            favorito => String(favorito.alojamientoId) === String(alojamientoId)
          ));
        }

        return this.http.post(this.apiFavoritosUrl, { alojamientoId });
      })
    );
  }

  eliminarFavorito(id: string | number): Observable<void> {
    // El ID del registro favorito puede ser alfanumérico en JSON Server.
    // Propagamos errores HTTP para que Favoritos no confunda un fallo con éxito.
    return this.http.delete<void>(
      `${this.apiFavoritosUrl}/${encodeURIComponent(String(id))}`
    );
  }

  obtenerAlojamientoPorId(id: string): Observable<Alojamiento> {
    return this.http.get<Alojamiento>(`${this.apiUrl}/${id}`).pipe(
      catchError(error => {
        if (error.status !== 0 && error.status < 500) return throwError(() => error);
        const alojamiento = this.fallbackAlojamientos.find(
          item => String(item.id) === String(id)
        );

        return alojamiento ? of(alojamiento) : throwError(() => new Error("Alojamiento no disponible"));
      })
    );
  }

  crearAlojamiento(
    alojamiento: Omit<Alojamiento, 'id'>
  ): Observable<Alojamiento> {
    return this.http.post<Alojamiento>(
      this.apiUrl,
      alojamiento
    );
  }
  actualizarAlojamiento(
    id: string,
    alojamiento: Partial<Alojamiento>
  ): Observable<Alojamiento> {
    return this.http.patch<Alojamiento>(
      `${this.apiUrl}/${id}`,
      alojamiento
    );
  }

  eliminarAlojamiento(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
