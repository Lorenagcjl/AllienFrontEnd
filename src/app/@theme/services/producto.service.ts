import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Producto } from 'src/app/demo/models/producto.model';

@Injectable({
  providedIn: 'root',
})
export class ProductoService {
  private readonly apiUrl = 'http://localhost:8080/api/producto';

  private readonly http = inject(HttpClient);

  listarProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<Producto> {
    return this.http.get<Producto>(`${this.apiUrl}/${id}`);
  }

  crearProducto(payload: Partial<Producto>): Observable<Producto> {
    // POST /api/producto
    return this.http.post<Producto>(this.apiUrl, payload);
  }

  actualizarProducto(id: number, payload: Partial<Producto>): Observable<Producto> {
    // PUT /api/producto/{id}
    // (el backend fuerza el id del path; no dependes del id en el body)
    return this.http.put<Producto>(`${this.apiUrl}/${id}`, payload);
  }

  eliminarProducto(id: number): Observable<void> {
    // DELETE /api/producto/{id}
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  buscarPorSerial(esConSerial: boolean): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/serial/${esConSerial}`);
  }
}
