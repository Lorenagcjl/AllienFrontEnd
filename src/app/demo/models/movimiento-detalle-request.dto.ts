export interface MovimientoDetalleRequestDto {
  idMovimientoDetalle?: number;
  // Nota: Si el backend espera el objeto completo según tu DTO de Java:
  fkMovimiento?: { idMovimiento: number };
  fkProducto: { idProducto: number };
   idProducto: number;
  cantidad: number;
}
