import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompraProducto } from 'src/app/demo/models/compra-producto.model';

export interface CompraProductoRequest {
  fechaIngreso: string;
  observaciones: string;
  fkUsuario: { idUsuario: number };
}

@Injectable({
  providedIn: 'root',
})
export class CompraProductoService {
  private readonly apiUrl = 'http://localhost:8080/api/compraProducto';
  private readonly http = inject(HttpClient);

  listar(): Observable<CompraProducto[]> {
    return this.http.get<CompraProducto[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<CompraProducto> {
    return this.http.get<CompraProducto>(`${this.apiUrl}/${id}`);
  }

  crear(payload: CompraProductoRequest): Observable<CompraProducto> {
    return this.http.post<CompraProducto>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: CompraProductoRequest): Observable<CompraProducto> {
    return this.http.put<CompraProducto>(`${this.apiUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
