import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProductoPrecioVentaService {
  private http = inject(HttpClient);

  private productoUrl = 'http://localhost:8080/api/producto';
  private precioUrl = 'http://localhost:8080/api/productoPrecioVenta';

  // PATCH /api/producto/{id}/precio  (cambia el vigente y guarda historial)
  cambiarPrecio(idProducto: number, nuevoPrecio: number): Observable<void> {
    return this.http.patch<void>(`${this.productoUrl}/${idProducto}/precio`, { precioVenta: nuevoPrecio });
  }

  // GET /api/productoPrecioVenta/producto/{idProducto} (historial)
  obtenerHistorial(idProducto: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.precioUrl}/producto/${idProducto}`);
  }
}
