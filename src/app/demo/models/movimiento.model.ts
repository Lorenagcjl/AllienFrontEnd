import { Usuario } from "./user.model";

export interface Movimiento {
  idMovimiento?: number;
  fechaMovimiento: string;
  tipo: string;
  observaciones: string;
  fkUsuario: Usuario;
  idUbicacionOrigen: number;
  idUbicacionDestino: number;
}

export interface MovimientoRequest {
  fechaMovimiento: string;
  tipo: string;
  observaciones: string;
  idUsuario: number; // El ID plano que pide tu Dto de entrada
  idUbicacionOrigen: number;
  idUbicacionDestino: number;
}