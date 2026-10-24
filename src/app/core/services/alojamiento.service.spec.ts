import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';

import { AlojamientoService } from './alojamiento.service';

describe('AlojamientoService', () => {
  let service: AlojamientoService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule]
    });

    service = TestBed.inject(AlojamientoService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should return fallback alojamientos when the backend is unavailable', () => {
    let result: any[] = [];

    service.obtenerAlojamientos().subscribe((alojamientos) => {
      result = alojamientos;
    });

    const req = httpMock.expectOne('http://localhost:3000/alojamientos');
    req.flush(null, {
      status: 500,
      statusText: 'Server Error'
    });

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].titulo).toContain('Habitación');
  });
  it('does not substitute the first listing for a nonexistent ID', () => {
    let failed = false;
    service.obtenerAlojamientoPorId('missing').subscribe({ error: () => failed = true });
    httpMock.expectOne('http://localhost:3000/alojamientos/missing').flush(null, {status: 404, statusText: 'Not Found'});
    expect(failed).toBe(true);
  });

  it('saves alphanumeric IDs without coercion', () => {
    service.agregarFavorito('abc123').subscribe();
    httpMock.expectOne('http://localhost:3000/favoritos').flush([]);
    const request = httpMock.expectOne('http://localhost:3000/favoritos');
    expect(request.request.body).toEqual({ alojamientoId: 'abc123' });
    request.flush({id: 'f1', alojamientoId: 'abc123'});
  });

  it('propagates save errors instead of reporting temporary success', () => {
    let failed = false;
    service.agregarFavorito('abc123').subscribe({ error: () => failed = true });
    httpMock.expectOne('http://localhost:3000/favoritos').flush([]);
    httpMock.expectOne('http://localhost:3000/favoritos').flush(null, {status: 500, statusText: 'Server Error'});
    expect(failed).toBe(true);
  });

});
