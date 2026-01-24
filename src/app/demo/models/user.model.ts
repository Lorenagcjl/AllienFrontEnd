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
  ultimoAcceso?: string;
}