import { Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AlojamientoService } from '../core/services/alojamiento.service';

/** Modelo de presentación: evita depender de campos opcionales del modelo del backend. */
interface AlojamientoFavorito {
  id: string | number;
  titulo: string;
  tipo: string;
  precio: number;
  distrito: string;
  provincia: string;
  ubicacion: string;
  imagen: string;
  descripcion: string;
  fecha: string;
  latitud: number | null;
  longitud: number | null;
}

type EstadoClima =
  | { estado: 'cargando' }
  | { estado: 'error' }
  | { estado: 'sin-ubicacion' }
  | {
      estado: 'listo';
      temperatura: number;
      humedad: number;
      descripcion: string;
      icono: string;
    };

interface RespuestaOpenMeteo {
  current?: {
    temperature_2m?: number;
    relative_humidity_2m?: number;
    weather_code?: number;
    is_day?: number;
  };
}

const COORDENADAS_ZONAS: Record<string, [number, number]> = {
  'san miguel, lima': [-12.0772, -77.0921],
  'pueblo libre, lima': [-12.0715, -77.0620],
  'miraflores, lima': [-12.1220, -77.0305],
  'surco, lima': [-12.1380, -76.9820],
  'santiago de surco, lima': [-12.1380, -76.9820],
  'san borja, lima': [-12.1070, -77.0010],
  'los olivos, lima': [-11.9680, -77.0730],
  'cercado, arequipa': [-16.3989, -71.5350],
  'arequipa, arequipa': [-16.3989, -71.5350],
  'yanahuara, arequipa': [-16.3896, -71.5408],
  'cusco, cusco': [-13.5319, -71.9675],
  'wanchaq, cusco': [-13.5240, -71.9600]
};

const ETIQUETAS_TIPO: Record<string, string> = {
  individual: 'Habitación individual',
  pareja: 'Espacio para pareja',
  minidepa: 'Minidepartamento',
  departamento: 'Departamento'
};

const ICONOS_TIPO: Record<string, string> = {
  individual: 'fa-bed',
  pareja: 'fa-heart',
  minidepa: 'fa-house',
  departamento: 'fa-building'
};

const CACHE_CLIMA_MS = 10 * 60 * 1000;

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DecimalPipe],
  templateUrl: './favoritos.html',
  styleUrl: './favoritos.css'
})
export class Favoritos implements OnInit {
  private readonly alojamientoService = inject(AlojamientoService);
  private readonly fb = inject(FormBuilder);
  private readonly destroyRef = inject(DestroyRef);

  readonly formulario = this.fb.nonNullable.group({
    tipo: 'todos',
    precioMaximo: '',
    ordenar: 'recientes'
  });

  readonly favoritos = signal<AlojamientoFavorito[]>([]);
  readonly resultados = signal<AlojamientoFavorito[]>([]);
  readonly cargando = signal(true);
  readonly errorCarga = signal('');
  readonly errorAccion = signal('');
  readonly eliminandoIds = signal<ReadonlySet<string | number>>(new Set<string | number>());
  readonly climaPorZona = signal<Record<string, EstadoClima>>({});
  readonly menuAbierto = signal(false);
  readonly cantidadFavoritos = computed(() => this.favoritos().length);

  // Cache por coordenadas: múltiples alojamientos de una misma zona comparten consulta.
  private readonly cacheClima = new Map<string, { vence: number; pendiente: boolean }>();
  private readonly abortadores = new Set<AbortController>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.abortadores.forEach(controlador => controlador.abort());
      this.abortadores.clear();
    });
  }

  ngOnInit(): void {
    this.formulario.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.aplicarFiltros());
    this.cargarFavoritos();
  }

  /** Obtiene la lista y sus favoritos desde el mismo servicio del resto de Angular. */
  cargarFavoritos(): void {
    this.cargando.set(true);
    this.errorCarga.set('');

    forkJoin({
      alojamientos: this.alojamientoService.obtenerAlojamientos(),
      registros: this.alojamientoService.obtenerFavoritos()
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ alojamientos, registros }) => {
          const ids = new Set(registros.map(registro => String(registro.alojamientoId)));
          const alojamientosNormalizados = alojamientos
            .map((alojamiento: unknown) => this.normalizarAlojamiento(alojamiento))
            .filter((item): item is AlojamientoFavorito => item !== null);

          this.favoritos.set(alojamientosNormalizados.filter(item => ids.has(String(item.id))));
          this.cargando.set(false);
          this.aplicarFiltros();
        },
        error: error => {
          console.error('No se pudieron cargar los favoritos:', error);
          this.cargando.set(false);
          this.errorCarga.set('No pudimos cargar tus favoritos. Comprueba la conexión con el servicio e inténtalo de nuevo.');
          this.resultados.set([]);
        }
      });
  }

  aplicarFiltros(): void {
    const { tipo, precioMaximo, ordenar } = this.formulario.getRawValue();
    // Los input[type=number] pueden producir un number incluso con un FormControl<string>.
    const valorPrecio = String(precioMaximo ?? '').trim();
    const numeroPrecio = valorPrecio === '' ? Infinity : Number(valorPrecio);
    const maximo = Number.isFinite(numeroPrecio) && numeroPrecio >= 0 ? numeroPrecio : Infinity;

    const filtrados = this.favoritos().filter(item =>
      (tipo === 'todos' || item.tipo === tipo) && item.precio <= maximo
    );

    if (ordenar === 'precio-asc') filtrados.sort((a, b) => a.precio - b.precio);
    else if (ordenar === 'precio-desc') filtrados.sort((a, b) => b.precio - a.precio);
    else filtrados.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    this.resultados.set(filtrados);
    this.consultarClimaVisible(filtrados);
  }

  ordenarResultados(): void {
    this.aplicarFiltros();
  }

  limpiarFiltros(): void {
    this.formulario.reset({ tipo: 'todos', precioMaximo: '', ordenar: 'recientes' });
    // valueChanges aplica automáticamente el filtro después de resetear.
  }

  /** Elimina el registro favorito y verifica la respuesta del servidor. */
  quitarDeFavoritos(id: string | number): void {
    if (this.eliminandoIds().has(id)) return;

    this.errorAccion.set('');
    this.eliminandoIds.update(actual => new Set([...actual, id]));

    this.alojamientoService.obtenerFavoritos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: registros => {
          const registro = registros.find(item => String(item.alojamientoId) === String(id));

          if (!registro) {
            this.errorAccion.set('Este alojamiento ya no aparece entre los favoritos. Recarga la lista.');
            this.finalizarEliminacion(id);
            return;
          }

          // JSON Server usa IDs de registro de tipo string, incluso alfanuméricos.
          // alojamientoId identifica el inmueble; registro.id identifica el favorito.
          const idRegistro = registro.id;
          if ((typeof idRegistro !== 'string' && typeof idRegistro !== 'number') ||
              String(idRegistro).trim() === '') {
            this.errorAccion.set('No se pudo identificar el registro favorito para eliminarlo.');
            this.finalizarEliminacion(id);
            return;
          }

          this.alojamientoService.eliminarFavorito(String(idRegistro))
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
              next: () => this.verificarEliminacion(id),
              error: error => {
                console.error('Error al quitar favorito:', error);
                this.errorAccion.set('No se pudo quitar el favorito. Comprueba tu conexión.');
                this.finalizarEliminacion(id);
              }
            });
        },
        error: error => {
          console.error('Error al consultar favoritos:', error);
          this.errorAccion.set('No pudimos consultar tus favoritos. Inténtalo nuevamente.');
          this.finalizarEliminacion(id);
        }
      });
  }

  /** Verifica que el servidor ya no devuelva el favorito antes de retirar la tarjeta. */
  private verificarEliminacion(id: string | number): void {
    this.alojamientoService.obtenerFavoritos()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: registrosActualizados => {
          const sigueGuardado = registrosActualizados.some(
            item => String(item.alojamientoId) === String(id)
          );

          if (sigueGuardado) {
            this.errorAccion.set(
              'No se confirmó la eliminación. El servidor podría no estar disponible; el favorito sigue guardado.'
            );
          } else {
            this.favoritos.update(actual => actual.filter(item => item.id !== id));
            this.aplicarFiltros();
          }
          this.finalizarEliminacion(id);
        },
        error: error => {
          console.error('No se pudo verificar la eliminación:', error);
          this.errorAccion.set('No fue posible comprobar la eliminación. Actualiza la página más tarde.');
          this.finalizarEliminacion(id);
        }
      });
  }

  private finalizarEliminacion(id: string | number): void {
    this.eliminandoIds.update(actual => {
      const copia = new Set(actual);
      copia.delete(id);
      return copia;
    });
  }

  etiquetaTipo(tipo: string): string {
    return ETIQUETAS_TIPO[tipo] || tipo || 'Alojamiento';
  }

  iconoTipo(tipo: string): string {
    return ICONOS_TIPO[tipo] || 'fa-house';
  }

  cambiarMenu(): void {
    this.menuAbierto.update(abierto => !abierto);
  }

  cerrarMenu(): void {
    this.menuAbierto.set(false);
  }

  climaPara(alojamiento: AlojamientoFavorito): EstadoClima {
    const ubicacion = this.coordenadasDe(alojamiento);
    if (!ubicacion) return { estado: 'sin-ubicacion' };
    const clave = this.claveCoordenadas(ubicacion[0], ubicacion[1]);
    return this.climaPorZona()[clave] || { estado: 'cargando' };
  }

  private normalizarAlojamiento(item: unknown): AlojamientoFavorito | null {
    if (!item || typeof item !== 'object') return null;
    const datos = item as Record<string, unknown>;
    const id = datos['id'];
    if ((typeof id !== 'string' && typeof id !== 'number') || String(id).trim() === '') return null;

    const texto = (clave: string): string =>
      typeof datos[clave] === 'string' ? String(datos[clave]).trim() : '';
    const numero = (clave: string): number | null => {
      const valor = datos[clave];
      if (valor === null || valor === undefined || valor === '') return null;
      const convertido = Number(valor);
      return Number.isFinite(convertido) ? convertido : null;
    };

    const distrito = texto('distrito');
    const provincia = texto('provincia');
    const ubicacion = texto('ubicacion') || [distrito, provincia].filter(Boolean).join(', ');
    const imagenRecibida = texto('imagen') || '/Imagenes/alojamiento.jpg';
    // Imágenes antiguas: ../Imagenes/...; en Angular están dentro de public/Imagenes/.
    const imagen = imagenRecibida.startsWith('../Imagenes/')
      ? imagenRecibida.replace('../Imagenes/', '/Imagenes/')
      : imagenRecibida;

    const tipoOriginal = texto('tipo').toLowerCase();
    const tipo = tipoOriginal.includes('individual') ? 'individual'
      : tipoOriginal.includes('pareja') ? 'pareja'
      : tipoOriginal.includes('minidepa') ? 'minidepa'
      : tipoOriginal.includes('departamento') ? 'departamento'
      : tipoOriginal;

    return {
      id,
      titulo: texto('titulo') || 'Alojamiento sin título',
      tipo,
      precio: numero('precio') ?? 0,
      distrito,
      provincia,
      ubicacion: ubicacion || 'Ubicación no especificada',
      imagen,
      descripcion: texto('descripcion'),
      fecha: texto('fecha') || '1970-01-01',
      latitud: numero('latitud'),
      longitud: numero('longitud')
    };
  }

  /** Para anuncios publicados, prioriza coordenadas reales; catálogo inicial, centro de zona. */
  private coordenadasDe(item: AlojamientoFavorito): [number, number] | null {
    if (item.latitud !== null && item.longitud !== null &&
        Math.abs(item.latitud) <= 90 && Math.abs(item.longitud) <= 180 &&
        !(item.latitud === 0 && item.longitud === 0)) {
      return [item.latitud, item.longitud];
    }
    const clave = (item.distrito && item.provincia
      ? `${item.distrito}, ${item.provincia}`
      : item.ubicacion).toLowerCase().trim();
    return COORDENADAS_ZONAS[clave] || null;
  }

  private claveCoordenadas(latitud: number, longitud: number): string {
    return `${latitud.toFixed(3)},${longitud.toFixed(3)}`;
  }

  private consultarClimaVisible(alojamientos: AlojamientoFavorito[]): void {
    for (const alojamiento of alojamientos) {
      const coordenadas = this.coordenadasDe(alojamiento);
      if (!coordenadas) continue;
      const [latitud, longitud] = coordenadas;
      const clave = this.claveCoordenadas(latitud, longitud);
      const cache = this.cacheClima.get(clave);
      if (cache && (cache.pendiente || cache.vence > Date.now())) continue;
      this.pedirClima(latitud, longitud, clave);
    }
  }

  private async pedirClima(latitud: number, longitud: number, clave: string): Promise<void> {
    this.climaPorZona.update(actual => ({ ...actual, [clave]: { estado: 'cargando' } }));
    this.cacheClima.set(clave, { vence: Date.now() + CACHE_CLIMA_MS, pendiente: true });
    const controlador = new AbortController();
    this.abortadores.add(controlador);

    const parametros = new URLSearchParams({
      latitude: String(latitud),
      longitude: String(longitud),
      current: 'temperature_2m,relative_humidity_2m,weather_code,is_day',
      timezone: 'auto'
    });

    try {
      const respuesta = await fetch(`https://api.open-meteo.com/v1/forecast?${parametros}`, {
        signal: controlador.signal
      });
      if (!respuesta.ok) throw new Error(`Error HTTP ${respuesta.status}`);
      const datos = await respuesta.json() as RespuestaOpenMeteo;
      const actual = datos.current;
      if (!actual || typeof actual.temperature_2m !== 'number' ||
          typeof actual.relative_humidity_2m !== 'number') {
        throw new Error('Información meteorológica incompleta');
      }

      const condicion = this.interpretarClima(actual.weather_code ?? -1, actual.is_day === 1);
      this.climaPorZona.update(estados => ({
        ...estados,
        [clave]: {
          estado: 'listo',
          temperatura: Math.round(actual.temperature_2m!),
          humedad: Math.round(actual.relative_humidity_2m!),
          descripcion: condicion.descripcion,
          icono: condicion.icono
        }
      }));
      this.cacheClima.set(clave, { vence: Date.now() + CACHE_CLIMA_MS, pendiente: false });
    } catch (error) {
      if (!controlador.signal.aborted) {
        console.warn('No fue posible obtener el clima:', error);
        this.climaPorZona.update(actual => ({ ...actual, [clave]: { estado: 'error' } }));
        // No lanzar solicitudes en bucle mientras cambian los filtros.
        this.cacheClima.set(clave, { vence: Date.now() + 60_000, pendiente: false });
      }
    } finally {
      this.abortadores.delete(controlador);
    }
  }

  private interpretarClima(codigo: number, dia: boolean): { descripcion: string; icono: string } {
    if (codigo === 0) return { descripcion: 'Cielo despejado', icono: dia ? 'fa-sun' : 'fa-moon' };
    if (codigo === 1 || codigo === 2) return { descripcion: 'Parcialmente nublado', icono: dia ? 'fa-cloud-sun' : 'fa-cloud-moon' };
    if (codigo === 3) return { descripcion: 'Nublado', icono: 'fa-cloud' };
    if (codigo === 45 || codigo === 48) return { descripcion: 'Niebla', icono: 'fa-smog' };
    if (codigo >= 51 && codigo <= 57) return { descripcion: 'Llovizna', icono: 'fa-cloud-rain' };
    if (codigo >= 61 && codigo <= 67) return { descripcion: 'Lluvia', icono: 'fa-cloud-rain' };
    if (codigo >= 71 && codigo <= 77) return { descripcion: 'Nieve', icono: 'fa-snowflake' };
    if (codigo >= 80 && codigo <= 82) return { descripcion: 'Chubascos', icono: 'fa-cloud-showers-heavy' };
    if (codigo === 85 || codigo === 86) return { descripcion: 'Nevadas', icono: 'fa-snowflake' };
    if (codigo >= 95 && codigo <= 99) return { descripcion: 'Tormenta', icono: 'fa-cloud-bolt' };
    return { descripcion: 'Estado del tiempo', icono: 'fa-cloud' };
  }
}
