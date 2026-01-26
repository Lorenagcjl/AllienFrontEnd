import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { InventarioMovimiento } from 'src/app/demo/models/inventariomovimiento.model';

@Injectable({
  providedIn: 'root'
})
export class InventarioMovimientoService {

  private apiUrl = 'http://localhost:8080/api/inventarioMovimiento';

  constructor(private http: HttpClient) { }

  // Listar todos los movimientos
  listar(): Observable<InventarioMovimiento[]> {
    return this.http.get<InventarioMovimiento[]>(this.apiUrl);
  }

  // Guardar un nuevo movimiento (Venta, Compra, Traslado)
  guardar(movimiento: InventarioMovimiento): Observable<InventarioMovimiento> {
    return this.http.post<InventarioMovimiento>(this.apiUrl, movimiento);
  }

  // Consultar stock actual de un producto en una ubicación
  obtenerStock(idProducto: number, idUbicacion: number): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/stock/producto/${idProducto}/ubicacion/${idUbicacion}`);
  }

  // Historial por serial
  buscarPorSerial(serial: string): Observable<InventarioMovimiento[]> {
    return this.http.get<InventarioMovimiento[]>(`${this.apiUrl}/serial/${serial}`);
  }
}