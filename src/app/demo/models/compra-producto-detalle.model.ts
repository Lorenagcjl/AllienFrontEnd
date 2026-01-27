export interface CompraProductoDetalle {
  idCompraProductoDetalle: number;
  cantidad: number | null;
  costoUnitario: number | null;

  fkCompraProducto: {
    idCompraProducto: number;
    fechaIngreso?: string | null;
    observaciones?: string | null;
    fkUsuario?: any; // si luego tienes modelo Usuario, lo tipas
  } | null;

  fkProducto: {
    idProducto: number;
    nombre?: string | null;
    foto?: string | null;
    descripcion?: string | null;
    precioVenta?: number | null;
    esConSerial?: boolean | null;
    porcentajeComision?: number | null;
    fechaCreacion?: string | null;
  } | null;

  fkUbicacion: {
    idUbicacion: number;
    nombre?: string | null;
    tipo?: string | null;
    descripcion?: string | null;
  } | null;
}
