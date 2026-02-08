export interface Usuario {
  idUsuario: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreUsuario: string;
  correoElectronico: string;
  cedula: string;
  rol: string;
  esActivo: boolean;
  esNuevo?: boolean;
  ultimoAcceso?: string;
}

export interface UsuarioCreateRequest {
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreUsuario: string;
  correoElectronico: string;
  cedula: string;
  clave: string;
  rol: string;
  esActivo?: boolean;
  esNuevo?: boolean;
}

export interface UsuarioUpdateRequest {
  idUsuario: number;
  primerNombre: string;
  segundoNombre: string;
  primerApellido: string;
  segundoApellido: string;
  nombreUsuario: string;
  correoElectronico: string;
  cedula: string;
  clave?: string;
  rol: string;
  esActivo?: boolean;
  esNuevo?: boolean;
}

export interface CambiarPasswordRequest {
  claveActual: string;
  claveNueva: string;
}
