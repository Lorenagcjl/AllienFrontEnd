import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { GuiaMovimientoResponseDto } from 'src/app/demo/models/reportes-inventario.model';

@Injectable({
  providedIn: 'root',
})
export class MovimientosService {
  private readonly baseUrl = 'http://localhost:8080/api/movimientos';
  private readonly http = inject(HttpClient);

  // GET /api/movimientos/{idMovimiento}/guia
  guiaMovimiento(idMovimiento: number): Observable<GuiaMovimientoResponseDto> {
    return this.http.get<GuiaMovimientoResponseDto>(`${this.baseUrl}/${idMovimiento}/guia`);
  }
}
