// src/app/core/models/detalle-catalogo.model.ts
export interface DetalleCatalogoResponseDto {
  idDetalleCatalogo: number;
  codigoDetalle: string;
  descripcion: string;
  valorNumerico: number;
  orden: number;
  esActivo: boolean;
  idCatalogo: number;
  // si tu backend devuelve también el nombre del catálogo, puedes agregarlo aquí:
  // nombreCatalogo?: string;
}

export interface DetalleCatalogoRequestDto {
  // en PUT el backend lo pisa con el id del path; por eso opcional
  idDetalleCatalogo?: number;
  codigoDetalle: string;
  descripcion: string;
  valorNumerico: number;
  orden: number;
  esActivo: boolean;
  idCatalogo: number;
}
