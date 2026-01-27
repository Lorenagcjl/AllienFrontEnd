import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { CompraProductoDetalle } from 'src/app/demo/models/compra-producto-detalle.model';

export interface CompraProductoDetalleRequest {
  cantidad: number;
  costoUnitario: number;
  fkCompraProducto: { idCompraProducto: number };
  fkProducto: { idProducto: number };
  fkUbicacion: { idUbicacion: number };
}

@Injectable({
  providedIn: 'root',
})
export class CompraProductoDetalleService {
  private readonly apiUrl = 'http://localhost:8080/api/compraProductoDetalle';
  private readonly http = inject(HttpClient);

  listar(): Observable<CompraProductoDetalle[]> {
    return this.http.get<CompraProductoDetalle[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<CompraProductoDetalle> {
    return this.http.get<CompraProductoDetalle>(`${this.apiUrl}/${id}`);
  }

  crear(payload: CompraProductoDetalleRequest): Observable<CompraProductoDetalle> {
    return this.http.post<CompraProductoDetalle>(this.apiUrl, payload);
  }

  actualizar(id: number, payload: CompraProductoDetalleRequest): Observable<CompraProductoDetalle> {
    return this.http.put<CompraProductoDetalle>(`${this.apiUrl}/${id}`, payload);
  }

  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarPorComprasUsuarioYProducto(idUsuario: number, idProducto: number): Observable<CompraProductoDetalle[]> {
    return this.http.get<CompraProductoDetalle[]>(
      `${this.apiUrl}/usuario/${idUsuario}/producto/${idProducto}`
    );
  }
}
