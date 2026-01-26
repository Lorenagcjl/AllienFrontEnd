export interface MovimientoModel {
    idMovimiento: number;
    fechaMovimiento: Date;
    observaciones: string;
    tipo: string;
    idUbicacionDestino: number;
    idUbicacionOrigen: number;
    idUsuario: number;
}