import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovimientoDetalleSerial } from 'src/app/demo/models/movimiento-detalle-serial.model';

@Injectable({
  providedIn: 'root',
})
export class MovimientoSeriesService {
  private readonly apiUrl = 'http://localhost:8080/api/movimientoSeries';
  private readonly http = inject(HttpClient);

  listarMovimientoSeries(): Observable<MovimientoDetalleSerial[]> {
    return this.http.get<MovimientoDetalleSerial[]>(this.apiUrl);
  }

  obtenerPorId(idMovimientoDetalleSerial: number): Observable<MovimientoDetalleSerial> {
    return this.http.get<MovimientoDetalleSerial>(`${this.apiUrl}/${idMovimientoDetalleSerial}`);
  }

  crearMovimientoSeries(payload: Partial<MovimientoDetalleSerial>): Observable<MovimientoDetalleSerial> {
    return this.http.post<MovimientoDetalleSerial>(this.apiUrl, payload);
  }

  actualizarMovimientoSeries(
    idMovimientoDetalleSerial: number,
    payload: Partial<MovimientoDetalleSerial>
  ): Observable<MovimientoDetalleSerial> {
    return this.http.put<MovimientoDetalleSerial>(`${this.apiUrl}/${idMovimientoDetalleSerial}`, payload);
  }

  eliminarMovimientoSeries(idMovimientoDetalleSerial: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${idMovimientoDetalleSerial}`);
  }
}
