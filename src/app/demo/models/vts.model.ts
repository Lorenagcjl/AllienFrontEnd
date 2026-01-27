export interface Vts {
  idVentaDetalleSerial?: number;

  fkDetalleVenta: {
    idDetalleVenta: number;
  };

  fkProductoSerial: {
    idProductoSerial: number;
  };
}
