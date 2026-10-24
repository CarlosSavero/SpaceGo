import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';

import { AlojamientoService } from '../core/services/alojamiento.service';
import { Favoritos } from './favoritos';


describe('Favoritos', () => {
  let fixture: ComponentFixture<Favoritos>;
  let componente: Favoritos;

  const alojamientosPrueba = [
    {
      id: 1, titulo: 'Habitación económica', tipo: 'individual', precio: 500,
      distrito: 'Distrito de prueba', provincia: 'Provincia de prueba',
      imagen: '/Imagenes/ejemplo.jpg', descripcion: 'Cómoda', fecha: '2026-07-01'
    },
    {
      id: 2, titulo: 'Minidepartamento', tipo: 'minidepa', precio: 1200,
      distrito: 'Distrito de prueba', provincia: 'Provincia de prueba',
      imagen: '/Imagenes/ejemplo2.jpg', descripcion: 'Amoblado', fecha: '2026-10-01'
    }
  ];

  let registros: { id: string; alojamientoId: number }[];
  let servicioSimulado: {
    obtenerAlojamientos: () => ReturnType<typeof of>;
    obtenerFavoritos: () => ReturnType<typeof of>;
    eliminarFavorito: (id: string | number) => ReturnType<typeof of>;
  };

  beforeEach(async () => {
    registros = [{ id: '10', alojamientoId: 1 }, { id: 'NyuUFVKvCs8', alojamientoId: 2 }];
    servicioSimulado = {
      obtenerAlojamientos: () => of(alojamientosPrueba),
      obtenerFavoritos: () => of([...registros]),
      eliminarFavorito: (id: string | number) => {
        registros = registros.filter(item => item.id !== String(id));
        return of(null);
      }
    };

    await TestBed.configureTestingModule({
      imports: [Favoritos],
      providers: [{ provide: AlojamientoService, useValue: servicioSimulado }]
    }).compileComponents();

    fixture = TestBed.createComponent(Favoritos);
    componente = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('crea el componente y carga solo los alojamientos marcados como favoritos', () => {
    expect(componente).toBeTruthy();
    expect(componente.resultados().length).toBe(2);
    expect(componente.errorCarga()).toBe('');
  });

  it('filtra por tipo y por precio máximo', () => {
    componente.formulario.patchValue({ tipo: 'individual', precioMaximo: '700' });
    expect(componente.resultados().length).toBe(1);
    expect(componente.resultados()[0].id).toBe(1);
  });

  it('ordena los alojamientos por precio descendente y limpia los filtros', () => {
    componente.formulario.patchValue({ ordenar: 'precio-desc' });
    expect(componente.resultados().map(item => item.id)).toEqual([2, 1]);
    componente.limpiarFiltros();
    expect(componente.formulario.getRawValue().ordenar).toBe('recientes');
    expect(componente.resultados().length).toBe(2);
  });

  it('quita el registro favorito sin eliminar el alojamiento del servicio', () => {
    componente.quitarDeFavoritos(1);
    expect(registros.length).toBe(1);
    expect(componente.resultados().map(item => item.id)).toEqual([2]);
    expect(alojamientosPrueba.length).toBe(2);
  });

  it('puede eliminar un favorito cuyo registro tiene ID alfanumérico', () => {
    componente.quitarDeFavoritos(2);
    expect(registros.some(registro => registro.id === 'NyuUFVKvCs8')).toBe(false);
    expect(componente.resultados().map(item => item.id)).toEqual([1]);
  });

  it('no oculta un favorito si el servicio simula un DELETE exitoso pero no lo borra', () => {
    // Simulación de un servicio que dice terminar, pero deja el registro intacto.
    servicioSimulado.eliminarFavorito = (_id: string | number) => of(undefined);

    componente.quitarDeFavoritos(1);

    expect(componente.resultados().map(item => item.id)).toContain(1);
    expect(componente.errorAccion()).toContain('No se confirmó');
    expect(componente.eliminandoIds().has(1)).toBe(false);
  });

  it('conserva el favorito si la petición DELETE falla', () => {
    servicioSimulado.eliminarFavorito = (_id: string | number) =>
      throwError(() => new Error('Servidor no disponible'));
    componente.quitarDeFavoritos(2);
    expect(componente.resultados().map(item => item.id)).toContain(2);
    expect(componente.errorAccion()).toContain('No se pudo quitar');
  });

  it('distingue un error de conexión de una lista vacía', () => {
    servicioSimulado.obtenerFavoritos = () => throwError(() => new Error('API desconectada'));
    componente.cargarFavoritos();
    expect(componente.errorCarga()).not.toBe('');
    expect(componente.cargando()).toBe(false);
  });
});
