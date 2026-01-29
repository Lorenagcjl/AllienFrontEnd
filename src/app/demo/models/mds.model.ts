export interface Mds {
  idMovimientoDetalleSerial?: number;

   fkMovimientoDetalle: {
    idDetalleVenta: number;
  };

  fkProductoSerial: {
    idProductoSerial: number;
  };
}
