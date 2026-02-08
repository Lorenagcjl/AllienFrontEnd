export interface DetalleCatalogoResponseDto {
  idDetalleCatalogo: number;
  codigoDetalle: string;
  descripcion: string;
  valorNumerico: number;
  orden: number;
  esActivo: boolean;
  idCatalogo: number;

  fechaCreacion?: string;
  fechaActualizacion?: string;
}


export interface DetalleCatalogoRequestDto {
  idDetalleCatalogo?: number;
  codigoDetalle: string;
  descripcion: string;
  valorNumerico: number;
  orden: number;
  esActivo: boolean;
  idCatalogo: number;
}
