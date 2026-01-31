// src/app/demo/models/movimiento-request.dto.ts
export interface MovimientoRequestDto {
  idMovimiento?: number;
  fechaMovimiento: Date | string;
  tipo: string;
  observaciones: string;
  idUbicacionOrigen: number;
  idUbicacionDestino: number;
  idUsuario: number; // ✅ Cambiar de fkUsuario a idUsuario
}
