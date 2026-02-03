import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DetalleVentaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/detalleVenta';

  // Obtener todos los detalles
  listar(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  guardar(detalle: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, detalle);
  }

  actualizar(id: number, detalle: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, detalle);
  }

  // ✅ NUEVO: Método para eliminar (DELETE)
  eliminar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
  //consulta especial por producto, ubicación y fechas
  consultarVentasEspeciales(idUbicacion: number, idProducto: number, inicio: string, fin: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ventas/ubicacion/${idUbicacion}/producto/${idProducto}/${inicio}/${fin}`);
  }
}