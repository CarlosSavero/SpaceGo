export interface Alojamiento {
  id: string | number;
  titulo: string;
  tipo: string;
  precio: number;
  departamento: string;
  provincia: string;
  distrito: string;
  imagen: string;
  descripcion: string;
  fecha: string;
  imagenes?: string[];
  latitud?: number | string | null;
  longitud?: number | string | null;
  capacidad?: string;
  referencia?: string;
  incluye?: string[];
  noIncluye?: string[];
  caracteristicas?: string[];
  contacto?: { telefono?: string; correo?: string };
}