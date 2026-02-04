export interface CatalogoResponseDto {
  idCatalogo: number;
  nombreCatalogo: string;
  descripcion?: string | null;
  esActivo: boolean;
}

export interface CatalogoRequestDto {
  nombreCatalogo: string;
  descripcion?: string | null;
  esActivo: boolean;
}
