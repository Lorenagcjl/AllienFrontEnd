import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VentaDetalleSerialModel } from 'src/app/demo/models/venta-detalle-serial.model';

@Injectable({
    providedIn: 'root'
})
export class VentaDetalleSerialService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/ventaDetalleSerial';

    listarVentaDetalleSerial(): Observable<VentaDetalleSerialModel[]> {
        return this.http.get<VentaDetalleSerialModel[]>(this.apiUrl);
    }
}