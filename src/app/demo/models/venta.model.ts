export interface VentaRequest {
  total: number;
  observaciones: string;
  fkCliente: { idCliente: number };
}

export interface VentaResponse {
  idVenta: number;
  numeroFactura: string;
  fechaVenta: string;
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