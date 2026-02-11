import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SerialEnStockDto, StockUbicacionDto } from 'src/app/demo/models/reportes-inventario.model';

@Injectable({
  providedIn: 'root',
})
export class InventarioRepostService {
  private readonly baseUrl = 'http://localhost:8080/api/inventario';
  private readonly http = inject(HttpClient);

  // GET /api/inventario/stock
  stockPorUbicacion(): Observable<StockUbicacionDto[]> {
    return this.http.get<StockUbicacionDto[]>(`${this.baseUrl}/stock`);
  }

  // GET /api/inventario/ubicaciones/{idUbicacion}/stock
  stockPorUnaUbicacion(idUbicacion: number): Observable<StockUbicacionDto[]> {
    return this.http.get<StockUbicacionDto[]>(`${this.baseUrl}/ubicaciones/${idUbicacion}/stock`);
  }

  // GET /api/inventario/ubicaciones/{idUbicacion}/seriales-disponibles
  serialesDisponiblesEnUbicacion(idUbicacion: number): Observable<SerialEnStockDto[]> {
    return this.http.get<SerialEnStockDto[]>(
      `${this.baseUrl}/ubicaciones/${idUbicacion}/seriales-disponibles`
    );
  }
}
