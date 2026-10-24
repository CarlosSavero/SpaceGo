import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { Alojamiento } from './alojamiento';
import { AlojamientoService } from '../core/services/alojamiento.service';

const registros = [
  {
    id: '1', titulo: 'Habitación individual amoblada', tipo: 'individual', precio: 650,
    departamento: 'Lima', provincia: 'Lima', distrito: 'San Miguel',
    imagen: '/Imagenes/depto01-dormitorio-principal.avif',
    descripcion: 'Habitación privada.', fecha: '2026-08-25'
  },
  {
    id: '7', titulo: 'Minidepartamento amoblado en Surco', tipo: 'minidepa', precio: 1450,
    departamento: 'Lima', provincia: 'Lima', distrito: 'Surco',
    imagen: '/Imagenes/depto04-sala-estar.avif',
    descripcion: 'Totalmente amoblado.', fecha: '2026-08-05'
  }
];

describe('Alojamiento - detalles dinámicos', () => {
  let fixture: ComponentFixture<Alojamiento>;
  let consulta$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let ruta$: BehaviorSubject<ReturnType<typeof convertToParamMap>>;
  let idsConsultados: string[];

  beforeEach(async () => {
    consulta$ = new BehaviorSubject(convertToParamMap({ id: '7' }));
    ruta$ = new BehaviorSubject(convertToParamMap({}));
    idsConsultados = [];

    const servicioDePrueba = {
      obtenerAlojamientoPorId(id: string) {
        idsConsultados.push(id);
        // Simula el fallback antiguo del servicio cuando el ID no existe.
        return of(registros.find(a => a.id === id) ?? registros[0]);
      },
      agregarFavorito() { return of({ id: 'f1', alojamientoId: 7 }); }
    };

    await TestBed.configureTestingModule({
      imports: [Alojamiento],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { paramMap: ruta$, queryParamMap: consulta$ } },
        { provide: AlojamientoService, useValue: servicioDePrueba }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Alojamiento);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('muestra el alojamiento elegido desde Favoritos (?id=7)', () => {
    const texto = fixture.nativeElement.textContent as string;
    expect(idsConsultados[0]).toBe('7');
    expect(texto).toContain('Minidepartamento amoblado en Surco');
    expect(texto).toContain('Totalmente amoblado.');
    expect(texto).not.toContain('Habitación individual amoblada');
  });

  it('actualiza los detalles si cambia el ID de la ruta', async () => {
    consulta$.next(convertToParamMap({ id: '1' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(idsConsultados.at(-1)).toBe('1');
    expect(fixture.nativeElement.textContent).toContain('Habitación individual amoblada');
  });

  it('no muestra un alojamiento distinto si el ID no existe', async () => {
    consulta$.next(convertToParamMap({ id: '99' }));
    fixture.detectChanges();
    await fixture.whenStable();
    const texto = fixture.nativeElement.textContent as string;
    expect(texto).toContain('Alojamiento no disponible');
    expect(texto).not.toContain('Habitación individual amoblada');
  });
  it('conserva el destino de búsqueda con sus filtros', async () => {
    consulta$.next(convertToParamMap({id: '7', volver: '/buscar?tipo=minidepa&precioMaximo=1500'}));
    fixture.detectChanges();
    expect(fixture.componentInstance.volverUrl).toBe('/buscar?tipo=minidepa&precioMaximo=1500');
    expect(fixture.nativeElement.textContent).toContain('Volver a resultados');
  });

  it('rechaza un destino externo para el botón volver', () => {
    consulta$.next(convertToParamMap({id: '7', volver: 'https://example.com'}));
    fixture.detectChanges();
    expect(fixture.componentInstance.volverUrl).toBe('/buscar');
  });

  it('identifica el regreso desde favoritos', () => {
    consulta$.next(convertToParamMap({id: '7', volver: '/favoritos'}));
    fixture.detectChanges();
    expect(fixture.componentInstance.textoVolver).toBe('Volver a favoritos');
  });

});
