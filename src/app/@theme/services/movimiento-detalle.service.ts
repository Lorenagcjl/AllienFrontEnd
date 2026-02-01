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
    // BUSCAR POR ID
    buscarPorId(id: number): Observable<MovimientoDetalleModel> {
        return this.http.get<MovimientoDetalleModel>(`${this.apiUrl}/${id}`);
    }

    // CREAR (POST)
    crear(detalle: MovimientoDetalleModel): Observable<MovimientoDetalleModel> {
        return this.http.post<MovimientoDetalleModel>(this.apiUrl, detalle);
    }

    // ACTUALIZAR (PUT)
    actualizar(id: number, detalle: MovimientoDetalleModel): Observable<MovimientoDetalleModel> {
        return this.http.put<MovimientoDetalleModel>(`${this.apiUrl}/${id}`, detalle);
    }

    // ELIMINAR (DELETE)
    eliminar(id: number): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${id}`);
    }
}