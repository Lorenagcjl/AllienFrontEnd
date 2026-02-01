import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VentaDetalleSerialRequest } from 'src/app/demo/models/venta-detalle-serial.model';

@Injectable({
    providedIn: 'root'
})
export class VentaDetalleSerialService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/ventaDetalleSerial';

    listarVentaDetalleSerial(): Observable<VentaDetalleSerialRequest[]> {
        return this.http.get<VentaDetalleSerialRequest[]>(this.apiUrl);
    }

    vincularSerialAVenta(payload: VentaDetalleSerialRequest): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
    registrar(body: any) {
    return this.http.post(this.apiUrl, body);
  }
}