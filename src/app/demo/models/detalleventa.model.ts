export interface Producto {
  idProducto?: number;
  nombre: string;
  codigo?: string;
}

export interface Venta {
  idVenta: number;
  fecha?: string;
  total?: number;
}

export interface Ubicacion {
  idUbicacion: number;
  nombre?: string;
}

export interface DetalleVenta {
  idDetalleVenta?: number;
  idVentaDetalle?: number; // Por si el backend usa este nombre
  cantidad: number;
  precioUnitario: number;
  porcentajeComision: number;
  subtotal: number;
  esActivo: boolean;
  fkVenta: Venta;
  fkProducto: Producto;
  fkUbicacion: Ubicacion;
}