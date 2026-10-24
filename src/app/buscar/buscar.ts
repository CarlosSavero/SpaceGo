import { Component, inject, OnInit } from '@angular/core';
import { ChangeDetectorRef } from '@angular/core';

import {
  FormBuilder,
  ReactiveFormsModule
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AlojamientoService } from '../core/services/alojamiento.service';
import { Alojamiento } from '../models/alojamiento';

@Component({
  selector: 'app-buscar',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './buscar.html',
  styleUrl: './buscar.css'
})
export class Buscar implements OnInit {

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  menuAbierto = false;
  get urlBusqueda(): string { return this.router.url; }

  private fb = inject(FormBuilder);
  private alojamientoService = inject(AlojamientoService);
  private cdr = inject(ChangeDetectorRef);

  alojamientos: Alojamiento[] = [];
  resultados: Alojamiento[] = [];
  departamentosDisponibles: string[] = [];
  provinciasDisponibles: string[] = [];
  distritosDisponibles: string[] = [];

  formularioBusqueda = this.fb.group({
    busqueda: [''],
    departamento: [''],
    provincia: [''],
    distrito: [''],
    tipo: [''],
    precioMaximo: [''],
    ordenar: ['recientes']
  });

  readonly nombresTipo: Record<string, string> = {
    individual: 'Habitación individual',
    pareja: 'Espacio para pareja',
    minidepa: 'Minidepartamento',
    departamento: 'Departamento'
  };

  obtenerNombreTipo(tipo: string): string {
    return this.nombresTipo[tipo] ?? tipo;
  }

  ngOnInit(): void {
    const query = this.route.snapshot.queryParamMap;
    const valores: Record<string, string> = {};
    for (const clave of Object.keys(this.formularioBusqueda.controls)) {
      valores[clave] = query.get(clave) ?? (clave === 'ordenar' ? 'recientes' : '');
    }
    this.formularioBusqueda.patchValue(valores);
    this.alojamientoService.obtenerAlojamientos().subscribe({
      next: (datos) => {
        console.log('ALOJAMIENTOS RECIBIDOS:', datos);

        this.alojamientos = datos;
        this.resultados = [...datos];
        this.departamentosDisponibles = [
          ...new Set(datos.map(alojamiento => alojamiento.departamento).filter(Boolean))
        ].sort();
        this.provinciasDisponibles = [
          ...new Set(datos.map(alojamiento => alojamiento.provincia).filter(Boolean))
        ].sort();
        this.distritosDisponibles = [
          ...new Set(datos.map(alojamiento => alojamiento.distrito).filter(Boolean))
        ].sort();

        this.aplicarFiltros(false);

        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar alojamientos:', error);
      }
    });
  }

  aplicarFiltros(actualizarUrl = true): void {
    const filtros = this.formularioBusqueda.value;

    const texto = (filtros.busqueda || '').trim().toLowerCase();
    const departamento = filtros.departamento || '';
    const provincia = filtros.provincia || '';
    const distrito = filtros.distrito || '';
    const tipo = filtros.tipo || '';

    const precioIngresado =
      filtros.precioMaximo === '' || filtros.precioMaximo === null || filtros.precioMaximo === undefined
        ? null
        : Number(filtros.precioMaximo);

    const precioMaximo =
      precioIngresado === null || !Number.isFinite(precioIngresado) || precioIngresado < 0
        ? Infinity
        : precioIngresado;

    this.resultados = this.alojamientos.filter((alojamiento) => {

      const coincideTexto =
        texto === '' ||
        alojamiento.titulo.toLowerCase().includes(texto) ||
        alojamiento.distrito.toLowerCase().includes(texto);

      const coincideDepartamento =
        departamento === '' ||
        alojamiento.departamento === departamento;

      const coincideProvincia =
        provincia === '' ||
        alojamiento.provincia === provincia;

      const coincideDistrito =
        distrito === '' ||
        alojamiento.distrito === distrito;

      const coincideTipo =
        tipo === '' ||
        alojamiento.tipo === tipo;

      const coincidePrecio =
        alojamiento.precio <= precioMaximo;

      return (
        coincideTexto &&
        coincideDepartamento &&
        coincideProvincia &&
        coincideDistrito &&
        coincideTipo &&
        coincidePrecio
      );
    });

    this.ordenarResultados(actualizarUrl);
  }

  ordenarResultados(actualizarUrl = true): void {
    if (actualizarUrl) {
      const queryParams = Object.fromEntries(Object.entries(this.formularioBusqueda.getRawValue())
        .filter(([, valor]) => valor !== '' && valor !== null));
      void this.router.navigate([], { relativeTo: this.route, queryParams, replaceUrl: true });
    }
    const criterio = this.formularioBusqueda.value.ordenar;

    if (criterio === 'precio-asc') {
      this.resultados.sort((a, b) => a.precio - b.precio);
    }

    if (criterio === 'precio-desc') {
      this.resultados.sort((a, b) => b.precio - a.precio);
    }

    if (criterio === 'recientes') {
      this.resultados.sort(
        (a, b) =>
          new Date(b.fecha).getTime() -
          new Date(a.fecha).getTime()
      );
    }
  }

  limpiarFiltros(): void {
    this.formularioBusqueda.reset({
      busqueda: '',
      departamento: '',
      provincia: '',
      distrito: '',
      tipo: '',
      precioMaximo: '',
      ordenar: 'recientes'
    });

    this.resultados = [...this.alojamientos];

    this.ordenarResultados();
  }
}