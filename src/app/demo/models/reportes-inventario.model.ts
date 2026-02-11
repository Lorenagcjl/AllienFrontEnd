// ===== INVENTARIO =====
export interface StockUbicacionDto {
  idUbicacion: number;
  ubicacion: string;
  idProducto: number;
  producto: string;
  stock: number;
}

// Este DTO no lo pegaste, pero tu endpoint lo devuelve.
// Ajusta nombres EXACTOS a lo que responde tu backend.
export interface SerialEnStockDto {
  idUbicacion: number;
  ubicacion: string;

  idProducto: number;
  producto: string;

  idProductoSerial: number;
  serial: string;
}

// ===== GUIA MOVIMIENTO =====
export interface GuiaMovimientoResponseDto {
  idMovimiento: number;
  tipo: string;
  fechaMovimiento: string; // LocalDateTime -> string ISO
  observaciones: string | null;

  usuario: GuiaUsuarioDto | null;
  ubicacionOrigen: GuiaUbicacionDto | null;
  ubicacionDestino: GuiaUbicacionDto | null;

  detalles: GuiaMovimientoDetalleDto[];
}

export interface GuiaUsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  primerNombre: string;
  primerApellido: string;
}

export interface GuiaUbicacionDto {
  idUbicacion: number;
  nombre: string;
}

export interface GuiaMovimientoDetalleDto {
  idMovimientoDetalle: number;
  idProducto: number;
  producto: string;
  marca: string;
  tipo: string;
  esConSerial: boolean;

  cantidad: number;

  seriales: string[];
}

// ===== COMISIONES =====
export interface ComisionUsuarioDto {
  idUsuario: number;
  nombreUsuario: string;
  nombres: string;

  totalVendido: number;   // BigDecimal -> number
  totalComision: number;  // BigDecimal -> number
}
