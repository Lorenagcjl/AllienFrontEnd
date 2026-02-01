// src/app/demo/models/movimiento-request.dto.ts
import { MovimientoDetalleRequestDto } from './movimiento-detalle-request.dto';

export interface MovimientoRequestDto {
  idMovimiento?: number;
  fechaMovimiento: Date | string;
  tipo: string;
  observaciones: string;
  idUbicacionOrigen: number;
  idUbicacionDestino: number;
  idUsuario: number;
  detalles: MovimientoDetalleRequestDto[];
}
