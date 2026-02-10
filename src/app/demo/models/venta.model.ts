export interface VentaRequest {
  subtotal?: number;
  ivaPorcentaje?: number;
  ivaValor?: number;
  total: number;

  observaciones: string;
  fkCliente: { idCliente: number };
}

export interface VentaResponse {
  idVenta: number;
  numeroFactura: string;
  fechaVenta: string;

  subtotal?: number;     
  ivaPorcentaje?: number;
  ivaValor?: number;     

  total: number;
  observaciones: string;

  fkCliente: {
    idCliente: number;
    primerNombre: string;
    primerApellido: string;
  };

  fkUsuario: {
    idUsuario: number;
    nombreUsuario: string;
    primerNombre: string;
  };
}
