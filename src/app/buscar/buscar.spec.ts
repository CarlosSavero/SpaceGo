import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { of } from 'rxjs';
import { Buscar } from './buscar';
import { AlojamientoService } from '../core/services/alojamiento.service';

const anuncios = [
  {id:'a1', titulo:'Habitación', tipo:'individual', precio:650, distrito:'San Miguel', departamento:'Lima', provincia:'Lima', fecha:'2026-01-01', imagen:'', descripcion:''},
  {id:'a2', titulo:'Minidepartamento', tipo:'minidepa', precio:1200, distrito:'Surco', departamento:'Lima', provincia:'Lima', fecha:'2026-02-01', imagen:'', descripcion:''}
];
describe('Buscar - navegación con filtros', () => {
  beforeEach(() => TestBed.configureTestingModule({
    providers: [provideRouter([{path:'buscar', component:Buscar}]),
      {provide:AlojamientoService, useValue:{obtenerAlojamientos:()=>of(anuncios)}}]
  }));
  it('restaura filtros desde la URL al volver o recargar', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/buscar?tipo=individual&precioMaximo=700', Buscar);
    expect(component.formularioBusqueda.value.tipo).toBe('individual');
    expect(component.resultados.map(a=>a.id)).toEqual(['a1']);
  });
  it('aplica el orden más reciente desde la primera carga', async () => {
    const harness = await RouterTestingHarness.create();
    const component = await harness.navigateByUrl('/buscar', Buscar);
    expect(component.resultados.map(a=>a.id)).toEqual(['a2','a1']);
  });
});
