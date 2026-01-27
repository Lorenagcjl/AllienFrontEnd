import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { MovimientoDetalleModel } from 'src/app/demo/models/movimiento-detalle.model';

@Injectable({
    providedIn: 'root'
})
export class MovimientoDetalleService {
    private http = inject(HttpClient);
    private apiUrl = 'http://localhost:8080/api/movimientoDetalle';

    listarMovimientoDetalles(): Observable<MovimientoDetalleModel[]> {
        return this.http.get<MovimientoDetalleModel[]>(this.apiUrl);
    }

    
}