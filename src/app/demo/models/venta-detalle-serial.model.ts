// venta-detalle-serial.model.ts
export interface VentaDetalleSerialRequest {
  fkDetalleVenta: { idDetalleVenta: number };
  fkProductoSerial: { idProductoSerial: number };
}