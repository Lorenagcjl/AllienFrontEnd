export interface Producto {
  idProducto: number;
  nombre: string;
  marca: string;
  tipo: string;
  foto: string;
  descripcion: string;
  precioVenta: number;
  esConSerial: boolean;
  porcentajeComision: number;
  fechaCreacion: string;
  esActivo?: boolean;
}
