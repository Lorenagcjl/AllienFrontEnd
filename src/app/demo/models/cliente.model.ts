import { Timestamp, timestamp, TimestampProvider } from "rxjs";

export interface Cliente {
  idCliente?:number;
  primerNombre:string;
  segundoNombre:string;
  primerApellido:string;
  segundoApellido:string;
  documento:string;
  telefono:string;
  email:string;
  direccion:string;
esActivo?: boolean;
}