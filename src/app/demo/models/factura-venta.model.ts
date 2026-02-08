export interface FacturaVentaResponse {
  idVenta: number;
  numeroFactura: string;
  fechaVenta: string; // ISO
  total: number;
  observaciones?: string;

  cliente: ClienteFactura;
  usuario: UsuarioFactura;

  detalles: DetalleFactura[];
}

export interface ClienteFactura {
  idCliente: number;
  primerNombre: string;
  segundoNombre?: string;
  primerApellido: string;
  segundoApellido?: string;
  documento: string;
  telefono: string;
  email: string;
  direccion: string;
}

export interface UsuarioFactura {
  idUsuario: number;
  nombreUsuario: string;
  primerNombre: string;
  primerApellido: string;
}

export interface DetalleFactura {
  idDetalleVenta: number;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;

  producto: ProductoFactura;
  ubicacion?: UbicacionFactura;

  seriales?: string[];
}

export interface ProductoFactura {
  idProducto: number;
  nombre: string;
  marca: string;
  tipo: string;
  esConSerial: boolean;
}

export interface UbicacionFactura {
  idUbicacion: number;
  nombre: string;
}
