export interface CompraProducto {
  idCompraProducto: number;
  fechaIngreso: string | null;
  observaciones: string | null;
  fkUsuario: { idUsuario: number } | null;
}
