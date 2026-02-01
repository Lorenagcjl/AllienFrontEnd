export interface MovimientoDetalleModel {
    idMovimientoDetalle?: number;
    cantidad: number;
    idProducto?: number;
    fkProducto?: {
        idProducto: number;
        nombre: string;
        precio: number;
    };
}

export interface MovimientoModel {
    idMovimiento: number;
    fechaMovimiento: Date;
    observaciones: string;
    tipo: string;
    idUbicacionDestino: number;
    idUbicacionOrigen: number;
    idUsuario: number;
    fkUsuario?: {
        idUsuario: number;
        primerNombre: string;
        primerApellido: string;
    };
    detalles?: MovimientoDetalleModel[];
}