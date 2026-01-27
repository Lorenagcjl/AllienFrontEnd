import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductoSerial } from 'src/app/demo/models/producto-serial.model';

export type ProductoSerialRequest = {
  serial: string;
  estado: string;
  fkProducto: { idProducto: number };
};

@Injectable({
  providedIn: 'root',
})
export class ProductoSerialService {
  private readonly apiUrl = 'http://localhost:8080/api/productoSerial';
  private readonly http = inject(HttpClient);

  listarProductosSerial(): Observable<ProductoSerial[]> {
    return this.http.get<ProductoSerial[]>(this.apiUrl);
  }

  obtenerPorId(id: number): Observable<ProductoSerial> {
    return this.http.get<ProductoSerial>(`${this.apiUrl}/${id}`);
  }

  crearProductoSerial(payload: ProductoSerialRequest): Observable<ProductoSerial> {
    // POST /api/productoSerial
    return this.http.post<ProductoSerial>(this.apiUrl, payload);
  }

  actualizarProductoSerial(id: number, payload: ProductoSerialRequest): Observable<ProductoSerial> {
    // PUT /api/productoSerial/{id}
    return this.http.put<ProductoSerial>(`${this.apiUrl}/${id}`, payload);
  }

  eliminarProductoSerial(id: number): Observable<void> {
    // DELETE /api/productoSerial/{id}
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
